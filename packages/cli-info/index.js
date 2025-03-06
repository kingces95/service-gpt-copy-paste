import { Lazy } from '@kingjs/lazy'
async function __import() {
  const { cliInfoToPojo } = await import('@kingjs/cli-info-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliInfoToPojo, dumpPojo }
}

export class CliInfo {
  #id
  #name

  constructor(id, name) {
    this.#id = id
    this.#name = name
  }

  get id() { return this.#id }
  get name() { return this.#name }

  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }
  get isClass() { return false }
}

export class CliParameterInfo extends CliInfo {
  #command
  #mdParameter

  constructor(command, name, mdParameter) {
    super(mdParameter.id, name)

    this.#command = command
    this.#mdParameter = mdParameter
  }

  get isOption() { return this.position === undefined }
  get isPositional() { return this.position !== undefined }

  get position() { return this.#mdParameter.position }
  get description() { return this.#mdParameter.description }
  get normalize() { return this.#mdParameter.normalize }
  get aliases() { return this.#mdParameter.aliases }
  get choices() { return this.#mdParameter.choices }
  get conflicts() { return this.#mdParameter.conflicts }
  get implies() { return this.#mdParameter.implies }
  get isLocal() { return this.#mdParameter.local }
  get isHidden() { return this.#mdParameter.hidden }

  get default() { return this.#mdParameter.default }
  get defaultDescription() { return this.#mdParameter.defaultDescription }
  get hasDefault() { return this.default !== undefined }
  get required() { return !this.hasDefault }

  get type() { return this.#mdParameter.type }
  get isString() { return this.type === 'string' }
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' }
  get isArray() { return this.type === 'array' }
  get isCount() { return this.type === 'count' }

  get command() { return this.#command }
}

export class CliCommandInfo extends CliInfo {
  #loader
  #metadata
  #commands
  #scope
  #parameters
  
  constructor(loader, mdClass, name, scope) {
    super(mdClass.id, name)

    this.#loader = loader
    this.#metadata = mdClass
    this.#scope = scope

    this.#parameters = new Lazy(() => {
      // Gather parameter metadata and select many parameters
      const parameterMd = [...this.#hierarchyMd()]
        .reverse()
        .map(o => o.parameters ?? { })
        .map(o => Object.entries(o))
        .flat()
  
      // Assert inherited parameters are declared
      const parameterIds = parameterMd.map(o => o[1].id)
      const inhertiedParameterIds = [...this.#scopes()]
        .map(o => [...o.parameters()].map(o => o.id))
        .flat()
      for (const id of inhertiedParameterIds) {
        if (!parameterIds.includes(id))
          throw new Error(`Parameter ${id} is not declared in ${this.fullName}`)
      } 
  
      // Load declared-only parameters
      const result = new Map()
      const declaredParameterMd = parameterMd.slice(inhertiedParameterIds.length)
      for (const [name, md] of declaredParameterMd) {
        result.set(name, new CliParameterInfo(this, name, md))
      }
      return result
    })

    // Load neested commands
    this.#commands = new Lazy(() => {
      const result = new Map()
      for (const [name, md] of Object.entries(mdClass.commands ?? { })) {
        const command = loader.getCommand$(md, name, this)
        result.set(name, command)
      }
      return result
    })
  }
  
  *#hierarchyMd() {
    let md = this.#metadata
    while (md) {
      yield md
      md = md.baseClass
    }
  }

  *#scopes() {
    for (let scope = this.#scope; scope; scope = scope.scope)
      yield scope
  }

  get scope() { return this.#scope }
  get fullName() { 
    return [this, ...this.#scopes()].reverse().map(o => o.name).join('.') 
  }
  get isGroup() { return this.#parameters.size == 0}

  get loader() { return this.#loader }
  get description() { return this.#metadata.description }
  *commands() { yield* this.#commands.value.values() }
  getCommand(name) { return this.#commands.value.get(name) }

  *parameters() { yield* this.#parameters.value.values() }

  toString() { return this.name }
}

export class CliInfoLoader {
  #commands
  #root

  constructor(metadata) {
    
    // link references
    for (const md of metadata) {

      // link baseClass
      if (md.baseClass)
        md.baseClass = metadata[md.baseClass[0]]

      // link commands
      if (md.commands)
        md.commands = Object.fromEntries(
          Object.entries(md.commands)
            .map(([name, [id]]) => [name, metadata[id]])
        )
    }

    this.#commands = []
    this.#root = this.getCommand$(metadata[0], '<root>')
  }

  getCommand$(md, name, scope) {
    const { id } = md
    if (!this.#commands[id])
      this.#commands[id] = new CliCommandInfo(this, md, name, scope)
    return this.#commands[id] 
  }

  get root() { return this.#root }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(this.root)
  }
  
  async __dump() {
    const { dumpPojo } = await __import()
    await dumpPojo(await this.toPojo())
  }
}
