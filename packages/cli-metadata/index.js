import _ from 'lodash'
import { LazyGenerator, Lazy } from '@kingjs/lazy'
import { LoadAsync, LoadAsyncGenerator } from '@kingjs/load'
import { Cli } from '@kingjs/cli'
import assert from 'assert'
async function __import() {
  const { cliMetadataToPojo } = await import('@kingjs/cli-metadata-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliMetadataToPojo, dumpPojo }
}

const PARAMETER_METADATA_NAMES =  [
  // arrays
  'aliases', 'choices', 'conflicts', 'implications',
  // functions
  'coerce',
  // strings
  'defaultDescription',
  // booleans
  'hidden', 'local', 'normalize'
]

export class CliMetadata {
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

  toString() { return this.name }
}

export class CliParameterMetadata extends CliMetadata {

  static getType(default$) {
    if (default$ === null) {
      return 'string'
    } else if (Array.isArray(default$)) {
      return 'array'
    } else if (default$ == String) {
      return 'string'
    } else if (default$ == Number) {
      return 'number'
    } else if (default$ == Boolean) {
      return 'boolean'
    } else if (default$ == Array) {
      return 'array'
    } else {
      const defaultType = typeof default$
      if (defaultType === 'string') {
        return 'string'
      } else if (defaultType == 'number') {
        return 'number'
      } else if (defaultType == 'boolean') {
        return 'boolean'
      }
    }

    return 'string'
  }

  #type
  #classInfo
  #default
  #hasDefault
  #metadata

  constructor(classInfo, id, name, metadata, default$) {
    super(id, name)

    this.#classInfo = classInfo
    this.#default = default$
    this.#hasDefault = default$ !== undefined
    this.#type = CliParameterMetadata.getType(default$)
    this.#metadata = metadata
  }

  get classInfo() { return this.#classInfo }
  get isParameter() { return true }

  // parameter type
  get type() { return this.#type }
  get isArray() { return this.type === 'array' }
  get isString() { return this.type === 'string' }
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' }
  get isCount() { return this.type === 'count' }
  get normalize() { return this.#metadata.normalize } // TODO: make path 1st class
  get coerce() { return this.#metadata.coerce }

  get description() { return this.#metadata.description }

  // default/require/optional
  get default() { return this.#default }
  get hasDefault() { return this.#hasDefault }
  get require() { return !this.hasDefault }
  get defaultDescription() { return this.#metadata.defaultDescription }

  // CliClassOptionInfo
  get local() { return this.#metadata.local }
  get hidden() { return this.#metadata.hidden }

  *aliases() { yield* this.#metadata.aliases ?? [] }
  *choices() { yield* this.#metadata.choices ?? [] }
  *conflicts() { yield* this.#metadata.conflicts ?? [] }
  *implications() { yield* this.#metadata.implications ?? [] }

  // CliClassPositionalInfo
  get position() { return undefined }

  toString() { return `${super.toString()}, class={ ${this.classInfo.toString() }}` }
}

class CliOptionMetadata extends CliParameterMetadata {
  constructor(classInfo, id, name, metadata, default$) {
    super(classInfo, id, name, metadata, default$)
  }

  get isOption() { return true }

  toString() { return `${super.toString()}, option, type=${this.type}` }
}

class CliPostionalMetadata extends CliParameterMetadata {
  constructor(classInfo, id, name, metadata, default$, position) {
    super(classInfo, id, name, metadata, default$)

    this.position$ = position
  }

  get isPositional() { return true }
  get position() { return this.position$ }

  toString() { return `${super.toString()}, positional` }
}

export class CliClassMetadata extends CliMetadata {

  static commonAncestor(classes) {
    const hierarchies = classes.map(cls => [...cls.hierarchy()].reverse())
    const commonAncestors = _.intersection(...hierarchies)
    const result = commonAncestors[commonAncestors.length - 1]
    return result
  }

  #loader
  #baseClass
  #class
  #description
  #hierarchy
  #positionals
  #options
  #parameters
  #commandMap
  #commands

  constructor(loader, id, class$) {
    super(id, class$.name)
    this.ref = [this.id, this.name]

    this.#loader = loader
    this.#class = class$
    this.#description = this.#getOwnClassMetadata('description')

    const parameters = this.#getOwnClassMetadata('parameters') ?? { }
    const defaults = this.#getOwnClassMetadata('defaults') ?? [{ }]
    const positionalDefaults = defaults.slice(0, defaults.length - 1)
    const optionDefaults = Object.entries(defaults[defaults.length - 1])

    this.#commandMap = new LoadAsync(async () => {
      // allows forward references to commands declared in the same module
      const commandsOrFn = this.#getOwnClassMetadata('commands') ?? { }
      const commands = typeof commandsOrFn == 'function' 
        ? await commandsOrFn() : await commandsOrFn

      const map = new Map()
      for (const [name, value] of Object.entries(commands)) {
        map.set(name, value)
      }
      return map
    })

    this.#commands = new LoadAsyncGenerator(async function* () {
      const commandMap = await this.#commandMap.load()
      for (const [name, value] of commandMap) {
        const { ref } = this.#loader.allocateClass$(await value)
        yield [name, ref]
      }
    }, this)

    this.#positionals = new LazyGenerator(function* () {
      const names = Object.keys(parameters)
      for (let i = 0; i < positionalDefaults.length; i++) {
        const name = names[i]
        const metadata = this.#getParameterMetadata(name)
        const id = this.#loader.allocateParameter$()
        yield new CliPostionalMetadata(this, id, name, metadata, defaults[i], i)
      }
    }, this)

    this.#options = new LazyGenerator(function* () {
      for (const [name, default$] of optionDefaults) {
        const metadata = this.#getParameterMetadata(name)
        const id = this.#loader.allocateParameter$()
        yield new CliOptionMetadata(this, id, name, metadata, default$)
      }
    }, this)

    this.#parameters = new LazyGenerator(function* () {
      yield* this.positionals()
      yield* this.options()
    }, this)

    this.#baseClass = new Lazy(() => {
      const baseClass = Object.getPrototypeOf(class$.prototype).constructor
      if (baseClass == Object)
        return null
      return this.#loader.allocateClass$(baseClass)
    })

    this.#hierarchy = new LazyGenerator(function* () {
      let current = this
      while (current) {
        yield current
        current = current.baseClass
      }
    }, this)
  }

  #getOwnClassMetadata(metadataName) {
    return Object.hasOwn(this.class, metadataName)
      ? this.class[metadataName] : null
  }

  #getParameterMetadata(parameterName) {
    return PARAMETER_METADATA_NAMES.reduce((acc, metadataName) => {
      const metadata = this.#getOwnClassMetadata(metadataName)
      const metadatum = metadata?.[parameterName]
      acc[metadataName] = metadatum
      return acc
    }, { })
  }

  get isClass() { return true }

  get loader() { return this.#loader }
  get class() { return this.#class }
  get description() { return this.#description }
  get baseClass() { return this.#baseClass.value }

  async *commands() { yield* await this.#commands.load() }
  async getCommand(name) { (await this.#commandMap.load()).get(name) }

  *hierarchy() { yield* this.#hierarchy.value }
  *positionals() { yield* this.#positionals.value }
  *options() { yield* this.#options.value }
  *parameters() { yield* this.#parameters.value }

  isSubClassOf(classMetadata) {
    if (!classMetadata)
      return false
    return this.class.prototype instanceof classMetadata.class
  }

  activate(args) { new this.class(args) }
}

export class CliMetadataLoader {
  static async load(name) {
    const loader = new CliMetadataLoader(name)
    return await loader.load()
  }

  #cache
  #root
  #metadata
  #parameterId

  constructor(class$) {
    this.#cache = new Map()
    this.#metadata = []
    this.#root = this.allocateClass$(class$)
    this.#parameterId = 0
  }

  allocateParameter$() { 
    return this.#parameterId++ 
  }

  allocateClass$(class$) {
    assert(typeof class$ == 'function', `Class ${class$} must be a function.`)
    assert(class$ == Cli || class$.prototype instanceof Cli, 
      `Class ${class$.name} must extend Cli.`)

    if (!this.#cache.has(class$)) {
      const metadata = new CliClassMetadata(this, this.#metadata.length, class$)
      this.#metadata.push(metadata)
      this.#cache.set(class$, metadata)
    }
    return this.#cache.get(class$)
  }

  async load() {
    return await this.#root
  }

  *metadata() {
    for(let i = 0; i < this.#metadata.length; i++) { 
      yield this.#metadata[i]
    }
  }

  async toPojo() {
    const { toPojo } = await __import()
    return toPojo(this.metadata(), 'list')
  }

  async __dump() {
    const { dumpPojo } = await __import()
    const pojo = await this.toPojo()
    await dumpPojo(pojo)
  }
}