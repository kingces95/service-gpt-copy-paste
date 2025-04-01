import { LazyGenerator, Lazy } from '@kingjs/lazy'
import { Cli, CliServiceProvider } from '@kingjs/cli'
import { CliCommand } from '@kingjs/cli-command'
async function __import() {
  const { cliMetadataToPojo } = await import('@kingjs/cli-metadata-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliMetadataToPojo, dumpPojo }
}

export class CliMetadata {
  #name
  
  constructor(name) {
    this.#name = name
  }

  get name() { return this.#name }

  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }
  get isClass() { return false }

  toString() { return this.name }
}

export class CliParameterMetadata extends CliMetadata {
  static create(scope, name, pojo) {
    return pojo.position !== undefined
      ? new CliPostionalMetadata(scope, name, pojo)
      : new CliOptionMetadata(scope, name, pojo)
  }

  #scope
  #pojo

  constructor(scope, name, pojo) {
    super(name)

    this.#scope = scope
    this.#pojo = pojo
  }

  get scope() { return this.#scope }
  get isParameter() { return true }
  get isOption() { }
  get isPositional() { }

  // parameter type
  get type() { return this.#pojo.type }
  get isArray() { return this.type === 'array' }
  get isString() { return this.type === 'string' }
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' }
  get isCount() { return this.type === 'count' }
  get normalize() { return this.#pojo.normalize } // TODO: make path 1st class
  get coerce() { return this.#pojo.coerce }

  get description() { return this.#pojo.description }
  get group() { return this.#pojo.group }
  get default() { return this.#pojo.default }
  get defaultDescription() { return this.#pojo.defaultDescription }
  get normalize() { return this.#pojo.normalize }
  
  *choices() { yield * this.#pojo.choices ?? [] }
  *aliases() { yield* this.#pojo.aliases ?? [] }
  *conflicts() { yield* this.#pojo.conflicts ?? [] }
  *implications() { yield* this.#pojo.implications ?? [] }

  // CliClassOptionInfo
  get local() { return undefined }
  get hidden() { return undefined }
  get required() { return undefined }

  // CliClassPositionalInfo
  get position() { return undefined }
  get optional() { return undefined }
  get variadic() { return undefined }

  toString() { return `${super.toString()}, class={ ${this.scope.toString() }}` }
}

class CliOptionMetadata extends CliParameterMetadata {
  #pojo

  constructor(scope, name, pojo) {
    super(scope, name, pojo)

    this.#pojo = pojo
  }

  get isOption() { return true }

  get local() { return this.#pojo.local }
  get hidden() { return this.#pojo.hidden }
  get required() { return this.#pojo.required }

  toString() { return `${super.toString()}, option, type=${this.type}` }
}

class CliPostionalMetadata extends CliParameterMetadata {
  #pojo

  constructor(scope, name, pojo) {
    super(scope, name, pojo)

    this.#pojo = pojo
  }

  get isPositional() { return true }
  get position() { return this.#pojo.position }
  get optional() { return this.#pojo.optional }
  get variadic() { return this.#pojo.variadic }

  toString() { return `${super.toString()}, positional` }
}

export class CliClassMetadata extends CliMetadata {
  static fromMetadataPojo(poja) { return CliMetadataPojoLoader.activate(poja) }
  static async fromClass(class$) { return CliMetadataClassLoader.activate(class$) }

  static isSubclassOf(classMd, scope, name) {
    const defaultScope = classMd.loader.scope

    let current = classMd.baseClass
    while (current) {
      if ((current.scope ?? defaultScope) == scope 
        && current.name == name)
        return true
      current = current.baseClass
    }
    return false
  }

  #loader
  #pojo
  #parameters
  #baren
  #classOrPojo

  constructor(loader, classOrPojo, id, name, pojo) {
    super(name)

    this.#loader = loader ?? this
    this.#classOrPojo = classOrPojo
    this.#pojo = pojo

    this.id = id
    this.ref = [this.id, this.name]

    this.#parameters = new LazyGenerator(function* () {
      const parameters = this.#pojo.parameters ?? { }
      for (const [name, pojo] of Object.entries(parameters)) {
        yield CliParameterMetadata.create(this, name, pojo)
      }
    }, this)

    // no own parameters and all own services are also baren
    this.#baren = new Lazy(() => {
      if (!this.parameters().next().done) return false
      return [...this.services()].every(o => o.baren)
    }, this)
  }

  get class$() { 
    return typeof this.#classOrPojo == 'function' ? this.#classOrPojo : null 
  }

  get isClass() { return true }

  get loader() { return this.#loader }
  get baseClass() { return this.loader.getBaseClass$(this.#classOrPojo) }
  get group() { return this.loader.getGroup$(this.#classOrPojo) }
  get scope() { return this.loader.getScope$(this.#classOrPojo) }
  get baren() { return this.#baren.value }

  get description() { return this.#pojo.description }
  get defaultCommand() { return this.#pojo.defaultCommand }

  *hierarchy() {
    yield this
    if (this.baseClass)
      yield* this.baseClass.hierarchy()
  }
  *parameters() { yield* this.#parameters.value }
  *commands() { yield* this.loader.commands$(this.#classOrPojo) }
  *services() { yield* this.loader.services$(this.#classOrPojo) }
  *groups() { yield* this.loader.groups$(this.#classOrPojo) }
}

export class CliMetadataLoader extends CliClassMetadata {
  #cache
  #loaded

  constructor(classOrPojo, id, name, pojo) {
    super(null, classOrPojo, id, name, pojo)

    this.#cache = new Map()
    this.#cache.set(classOrPojo, this)
    this.#loaded = [this]
  }

  activate$(classOrPojo, id) { throw 'abstract' }
  getBaseClass$(classOrPojo) { throw 'abstract' }
  getGroup$(classOrPojo) { throw 'abstract' }
  getScope$(classOrPojo) { throw 'abstract' }
  *commands$(classOrPojo) { throw 'abstract' }
  *services$(classOrPojo) { throw 'abstract' }

  load$(classOrPojo) {
    if (!this.#cache.has(classOrPojo)) {
      const metadata = this.activate$(classOrPojo, this.#loaded.length)
      this.#loaded.push(metadata)
      this.#cache.set(classOrPojo, metadata)
    }

    return this.#cache.get(classOrPojo)
  }

  *classes() {
    for(let id = 0; id < this.#loaded.length; id++) {
      const classMd = this.#loaded[id]
      yield classMd
    }
  }

  async toPojo() {
    const { toPojo } = await __import()
    return toPojo(this.classes(), { depth: 1, type: 'list' })
  }

  async __dump() {
    const { dumpPojo } = await __import()
    const pojo = await this.toPojo()
    await dumpPojo(pojo)
  }

  toString() { return `<root>, type=metadata` }
}

export class CliMetadataClassLoader extends CliMetadataLoader {
  static async activate(rootClass) {
    const scopeMap = new Map()
    const groupMap = new Map()
    const subCommandMap = new Map()

    for await (const [name, ...groups] of rootClass.ownGroups()) {
      for (const group of groups)
        groupMap.set(group, name)
    }

    // Squeeze out async operations. Pass the results as maps.
    const rootMd = new CliMetadataClassLoader(
      rootClass, groupMap, scopeMap, subCommandMap)

    const commands = []
    const services = []
    
    // load commands
    const stack = [rootMd]
    while (stack.length) {
      const classMd = stack.pop()

      subCommandMap.set(
        classMd.class$, 
        await CliMetadataClassLoader.getSubCommands(classMd.class$)
      )

      for (const [_, commandMd] of classMd.commands()) {
        stack.push(commandMd)
        commands.push(commandMd)
      }
    }

    // load base class of commands + services
    for (let classMd of commands) {
      while (classMd) {
        services.push(classMd)
        classMd = await classMd.baseClass
      }
    }

    // load base class of services
    for (let classMd of services) {
      while (classMd) {
        classMd = await classMd.baseClass
      }
    }

    // load package.json, harvest scopes
    for (const classMd of rootMd.classes()) {
      const moduleName = await classMd.class$.getModuleName()
      scopeMap.set(classMd.class$, moduleName.scope)
    }

    return rootMd
  }

  static async getSubCommands(class$) {
    const subCommands = []
    for await (const name of class$.ownCommandNames()) {
      const command = await class$.getCommand(name)
      if (!(command.prototype instanceof CliCommand))
        throw new Error(`Class ${command.name} must extend CliCommand.`)
      subCommands.push([name, command])
    }
    return subCommands
  }

  #groups
  #scopes
  #subCommands

  constructor(class$, groups, scopes, subCommands) {
    const { name } = class$
    super(class$, 0, name, class$.ownMetadata)

    this.#groups = groups
    this.#scopes = scopes
    this.#subCommands = subCommands
  }

  getGroup$(class$) { return this.#groups.get(class$) }
  getScope$(class$) { return this.#scopes.get(class$) }

  getBaseClass$(class$) { 
    const baseClass = Object.getPrototypeOf(class$.prototype).constructor
    return baseClass == Object ? null : this.load$(baseClass)
  }

  *commands$(class$) { 
    const subCommands = this.#subCommands.get(class$) ?? []
    yield* subCommands.map(([name, command]) => ([name, this.load$(command)]))
  }

  *services$(class$) { 
    for (const [_, service] of class$.getOwnServiceClasses())
      yield this.load$(service)

    for (const provider of class$.getOwnServiceProviderClasses())
      yield this.load$(provider)
  }

  activate$(class$, id) {
    if (typeof class$ != 'function')
      throw new Error(`Class ${class$} must be a function.`)
    if (class$ != Cli && !(class$.prototype instanceof Cli))
      throw new Error(`Class ${class$.name} must extend Cli.`)
    return new CliClassMetadata(this, class$, id, class$.name, class$.ownMetadata)
  }
}

export class CliMetadataPojoLoader extends CliMetadataLoader {
  static activate(poja) { 
    const rootMd = new CliMetadataPojoLoader(poja)

    for (let i = 1; i < poja.length; i++)
      rootMd.load$(rootMd.#poja[i])

    return rootMd
  }

  #poja

  constructor(poja) {
    const pojo = poja[0]
    const { id, name } = pojo
    super(pojo, id, name, pojo)
    this.#poja = poja
  }

  #loadRef(ref) { return this.load$(this.#poja[ref[0]]) }

  getGroup$(pojo) { return pojo.group }
  getScope$(pojo) { return pojo.scope }
  
  getBaseClass$(pojo) { 
    const { baseClass } = pojo
    return !baseClass ? null : this.#loadRef(baseClass)
  }

  *commands$(pojo) { 
    const { commands } = pojo
    for (const [name, ref] of Object.entries(commands ?? { }))
      yield [name, this.#loadRef(ref)]
  } 

  *services$(pojo) { 
    const { services } = pojo
    for (const ref of services ?? [ ])
      yield this.#loadRef(ref)
  } 

  activate$(pojo) {
    if (typeof pojo == 'function')
      throw new Error(`Expected a pojo.`)
    return new CliClassMetadata(this, pojo, pojo.id, pojo.name, pojo)
  }
}
