import { Lazy } from '@kingjs/lazy'
async function __import() {
  const { cliInfoToPojo } = await import('@kingjs/cli-info-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliInfoToPojo, dumpPojo }
}

export class CliClassInfoId {
  #id
  #name

  constructor(id, name) {
    this.#id = id
    this.#name = name ?? null
  }

  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }
  get isClass() { return false }
  get infoType() {
    if (this.isParameter) return 'parameter'
    if (this.isPositional) return 'positional'
    if (this.isOption) return 'option'
    if (this.isClass) return 'class'
    return 'info'
  }

  get id() { return this.#id }
  get name() { return this.#name }

  toString() { 
    return `${this.name}, ${this.infoType}, id=${this.id}` 
  }
}

export class CliClassParameterInfo extends CliClassInfoId {
  static create(info, name, mdParameter) {
    return mdParameter.position !== undefined
      ? new CliClassPositionalInfo(info, name, mdParameter)
      : new CliClassOptionInfo(info, name, mdParameter)
  }

  #command
  #description
  #normalize
  #aliases
  #choices
  #conflicts
  #implies
  #default
  #defaultDescription
  #type

  constructor(info, name, mdParameter) {
    super(mdParameter.id, name)
    this.#command = info
    
    this.#type = mdParameter.type
    this.#defaultDescription = mdParameter.defaultDescription
    this.#default = mdParameter.default

    this.#description = mdParameter.description
    this.#normalize = mdParameter.normalize
    this.#aliases = mdParameter.aliases
    this.#choices = mdParameter.choices
    this.#conflicts = mdParameter.conflicts
    this.#implies = mdParameter.implies
  }

  get isParameter() { return true }

  get type() { return this.#type }
  get isString() { return this.type === 'string' }
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' }

  get default() { return this.#default }
  get defaultDescription() { return this.#defaultDescription }

  get isRequired() { return undefined }
  get isOptional() { return undefined }
  get position() { return undefined }
  get isLocal() { return undefined }
  get isHidden() { return undefined }

  get description() { return this.#description }
  get normalize() { return this.#normalize }

  *aliases() { yield* this.#aliases ?? [] }
  *choices() { yield* this.#choices ?? [] }
  *conflicts() { yield* this.#conflicts ?? [] }
  *implies() { yield* this.#implies ?? [] }

  get command() { return this.#command }
}

export class CliClassOptionInfo extends CliClassParameterInfo {
  #isRequired
  #isLocal
  #isHidden

  constructor(command, name, mdOption) {
    super(command, name, mdOption)

    this.#isRequired = mdOption.isRequired
    this.#isLocal = mdOption.local
    this.#isHidden = mdOption.hide
  }

  get isOption() { return true }
  get isArray() { return this.type === 'array' }
  get isCount() { return this.type === 'count' }
  get isRequired() { return this.#isRequired }
  get isLocal() { return this.#isLocal }
  get isHidden() { return this.#isHidden }
  get default() { return !this.isRequired ? super.default : undefined }
}

export class CliClassPositionalInfo extends CliClassParameterInfo {
  #position
  #isOptional

  constructor(command, name, mdPositional) {
    super(command, name, mdPositional)

    this.#position = mdPositional.position
    this.#isOptional = mdPositional.isOptional
  }

  get isPositional() { return true }
  get position() { return this.#position }
  get isOptional() { return this.#isOptional }
  get default() { return this.isOptional ? super.default : undefined }
}

export class CliClassInfo extends CliClassInfoId {
  #parent
  #loader
  #description
  #parameters
  #entries
  
  constructor(loaderOrParent, mdClass) {
    super(mdClass.id, mdClass.name)

    const isRoot = loaderOrParent instanceof CliClassInfoLoader
    this.#loader = isRoot ? loaderOrParent : loaderOrParent.loader
    this.#parent = isRoot ? null : loaderOrParent

    this.#description = mdClass.description
    this.#parameters = new Lazy(() => {
      // Load declared-only parameters
      const result = new Map()
      for (const [name, md] of Object.entries(mdClass.parameters ?? { })) {
        result.set(name, CliClassParameterInfo.create(this, name, md))
      }
      return result
    })

    this.#entries = new Lazy(() => {
      const result = new Map()
      for (const [name, ref] of Object.entries(mdClass.commands ?? { })) {
        const md = this.#loader.getClassMetadata$(ref)
        const scope = new CliClassInfo(this, md)
        result.set(name, scope)
      }
      return result
    })
  }
  
  get isClass() { return true }
  get loader() { return this.#loader }
  get parent() { return this.#parent }

  *hierarchy() {
    yield this
    if (this.parent)
      yield* this.parent.hierarchy()
  }

  get description() { return this.#description }
  *parameters() { yield* this.#parameters.value.values() }
  getParameter(name) { return this.#parameters.value.get(name) }
  *entries() { 
    yield* this.#entries.value.keys()
      .map(name => [name, this.getEntry(name)]) 
  }
  getEntry(name) { return this.#entries.value.get(name) }
}

export class CliClassInfoLoader {
  static load(metadata) {
    const loader = new CliClassInfoLoader(metadata)
    return loader.getClassInfo$(metadata[0])
  }

  #classInfos
  #metadata

  constructor(metadata) {
    this.#classInfos = []
    this.#metadata = metadata
  }

  getClassMetadata$(classRef) {
    if (!classRef) return null
    return this.#metadata[classRef[0]]
  }

  getClassInfo$(mdClass) {
    if (!mdClass) return null

    const { id } = mdClass
    if (!this.#classInfos[id]) {
      const baseClassMd = this.getClassMetadata$(mdClass.baseClass)
      const parent = this.getClassInfo$(baseClassMd)
      this.#classInfos[id] = new CliClassInfo(parent ?? this, mdClass)
    }
    return this.#classInfos[id] 
  }
}
