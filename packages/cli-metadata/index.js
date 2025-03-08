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
  #metadata

  constructor(classInfo, id, name, metadata) {
    super(id, name)

    this.#classInfo = classInfo
    this.#metadata = metadata
    this.#type = CliParameterMetadata.getType(this.default)
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
  get default() { return this.#metadata.default }
  get hasDefault() { return this.default !== undefined }
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
  constructor(classInfo, id, name, metadata) {
    super(classInfo, id, name, metadata)
  }

  get isOption() { return true }

  toString() { return `${super.toString()}, option, type=${this.type}` }
}

class CliPostionalMetadata extends CliParameterMetadata {
  constructor(classInfo, id, metadata) {
    const { name, position, ...rest } = metadata
    super(classInfo, id, name, rest)

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
  #commands

  constructor(loader, id, class$) {
    super(id, class$.name)
    this.ref = [this.id, this.name]

    this.#loader = loader
    this.#class = class$

    const {
      description,
      positionals = [],
      options = {},
    } = class$.metadata

    this.#description = description

    this.#commands = new LoadAsyncGenerator(async function* () {
      const commands = await this.class.loadCommands()
      for (const [name, value] of Object.entries(commands)) {
        const class$ = await value
        const { ref } = this.#loader.allocateClass$(class$)
        yield [name, ref]
      }
    }, this)

    this.#positionals = new LazyGenerator(function* () {
      for (let i = 0; i < positionals.length; i++) {
        const metadata = positionals[i]
        const id = this.#loader.allocateParameter$()
        yield new CliPostionalMetadata(this, id, metadata)
      }
    }, this)

    this.#options = new LazyGenerator(function* () {
      for (const [name, metadata] of Object.entries(options)) {
        const id = this.#loader.allocateParameter$()
        yield new CliOptionMetadata(this, id, name, metadata)
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

  get isClass() { return true }

  get loader() { return this.#loader }
  get class() { return this.#class }
  get description() { return this.#description }
  get baseClass() { return this.#baseClass.value }

  async *commands() { yield* await this.#commands.load() }
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
    return await loader.rootClass()
  }

  #cache
  #rootClass
  #metadata
  #parameterId

  constructor(class$) {
    this.#cache = new Map()
    this.#metadata = []
    this.#rootClass = this.allocateClass$(class$)
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

  async rootClass() {
    return await this.#rootClass
  }

  *loadedMetadata() {
    for(let i = 0; i < this.#metadata.length; i++) { 
      yield this.#metadata[i]
    }
  }

  async toPojo() {
    const { toPojo } = await __import()
    await this.rootClass()
    return toPojo(this.loadedMetadata(), 'list')
  }

  async __dump() {
    const { dumpPojo } = await __import()
    const pojo = await this.toPojo()
    await dumpPojo(pojo)
  }
}