import _ from 'lodash'
import { LazyGenerator } from '@kingjs/lazy'
import { Cli } from '@kingjs/cli'
import assert from 'assert'
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

  #scope
  #pojo

  constructor(scope, name, pojo) {
    super(name)

    this.#scope = scope
    this.#pojo = pojo
  }

  get scope() { return this.#scope }
  get isParameter() { return true }

  // parameter type
  get type() { return this.#pojo.default !== undefined
    ? CliParameterMetadata.getType(this.#pojo.default)
    : this.variadic ? 'array'
    : this.isPositional && this.optional ? 'string'
    : 'string'
  }
  get isArray() { return this.type === 'array' }
  get isString() { return this.type === 'string' }
  get isBoolean() { return this.type === 'boolean' }
  get isNumber() { return this.type === 'number' }
  get isCount() { return this.type === 'count' }
  get normalize() { return this.#pojo.normalize } // TODO: make path 1st class
  get coerce() { return this.#pojo.coerce }

  get description() { return this.#pojo.description }
  get default() { return this.#pojo.default }
  get defaultDescription() { return this.#pojo.defaultDescription }
  get normalize() { return this.#pojo.normalize }
  
  *aliases() { yield* this.#pojo.aliases ?? [] }
  *choices() { yield* this.#pojo.choices ?? [] }
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

  #loader
  #pojo
  #parameters
  #baseClassFn
  #commandsFn

  constructor(loader, id, name, {
    baseClassFn,
    commandsFn,
    ...pojo
  }) {
    super(name)
    
    this.#loader = loader
    this.#pojo = pojo
    this.#baseClassFn = baseClassFn
    this.#commandsFn = commandsFn

    this.id = id
    this.ref = [this.id, this.name]

    this.#parameters = new LazyGenerator(function* () {
      const parameters = this.#pojo.parameters ?? { }
      for (const [name, pojo] of Object.entries(parameters)) {
        yield CliParameterMetadata.create(this, name, pojo)
      }
    }, this)
  }

  get isClass() { return true }
  get loader() { return this.#loader }
  get description() { return this.#pojo.description }
  get baseClass() { return this.#baseClassFn() }

  *hierarchy() {
    yield this
    if (this.baseClass)
      yield* this.baseClass.hierarchy()
  }

  async *commands() { yield* await this.#commandsFn() }
  *parameters() { yield* this.#parameters.value }
}

export class CliMetadataLoader {
  static load(classOrPojo) {
    return classOrPojo instanceof Function
      ? new CliMetadataClassLoader(classOrPojo)
      : new CliMetadataPojoLoader(classOrPojo)
  }

  #map
  #stack
  #lookup

  constructor(classOrPojo) {
    this.#map = new Map()
    this.#stack = []
    this.#lookup = []
    this.load$(classOrPojo)
  }

  activate$(classOrPojo, id) { throw 'abstract' }

  load$(classOrPojo) {
    if (!this.#map.has(classOrPojo)) {
      const metadata = this.activate$(classOrPojo, this.#stack.length)
      this.#stack.push(metadata)
      this.#map.set(classOrPojo, metadata)
      this.#lookup[metadata.id] = metadata
    }

    return this.#map.get(classOrPojo)
  }

  getClass(id = 0) {
    const class$ = this.#lookup[id]
    if (!class$)
      throw new Error(`Class not found or not yet loaded: ${id}`)
    return class$
  }

  async *classes() {
    for(let i = 0; i < this.#stack.length; i++) { 
      const class$ = this.#stack[i]

      yield class$

      // eagerly load base class
      const _ = class$.baseClass

      // eagerly load commands by awaiting async commands generator
      for await (let _ of class$.commands()) { /* noop */ }
    }
  }

  async toPojo() {
    const { toPojo } = await __import()
    return toPojo(this.classes(), 'list')
  }

  async __dump() {
    const { dumpPojo } = await __import()
    const pojo = await this.toPojo()
    await dumpPojo(pojo)
  }
}

export class CliMetadataClassLoader extends CliMetadataLoader {

  constructor(class$) {
    super(class$)
  }

  activate$(class$, id) {
    assert(typeof class$ == 'function', `Class ${class$} must be a function.`)
    assert(class$ == Cli || class$.prototype instanceof Cli, 
      `Class ${class$.name} must extend Cli.`)

    // inject base class resolution
    const baseClassFn = () => {
      const baseClass = Object.getPrototypeOf(class$.prototype).constructor
      return baseClass == Object ? null : this.load$(baseClass)
    }

    // inject command resolution
    const loader = this
    const commandsFn = async function*() {
      const commands = await class$.getOwnCommand()
      for (const [name, value] of Object.entries(commands)) {
        const class$ = await value
        yield [name, loader.load$(class$)]
      }
    }

    return new CliClassMetadata(this, id, class$.name, {
      ...class$.getOwnMetadata(),
      baseClassFn,
      commandsFn
    })
  }
}

export class CliMetadataPojoLoader extends CliMetadataLoader {
  #poja

  constructor(poja) {
    super(poja[0])
    this.#poja = poja
  }

  activate$(pojo) {
    assert(typeof pojo != 'function', `Expected a pojo.`)

    const { id, name, baseClass, commands, ...rest } = pojo
    const baseClassFn = () => baseClass ? this.load$(this.#poja[baseClass[0]]) : null

    const loader = this
    const commandsFn = async function*() {
      for (const [name, ref] of Object.entries(commands ?? { })) {
        const commandPojo = loader.#poja[ref[0]]
        yield [name, loader.load$(commandPojo)]
      }
    }

    return new CliClassMetadata(this, id, name, {
      ...rest,
      baseClassFn,
      commandsFn
    })
  }
}