import _ from 'lodash'
import { LazyGenerator } from '@kingjs/lazy'
import { Cli } from '@kingjs/cli'
import { CliProvider } from '@kingjs/cli-provider'
import { CliCommand } from '@kingjs/cli-command'
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
  static fromMetadataPojo(pojo) { return new CliMetadataPojoLoader(pojo) }
  static async fromClass(class$) {
    const rootMd = new CliMetadataClassLoader(class$)

    // Classes which are sub-classes of commands but are not themselves 
    // addressable should not return their sub-commands.

    // Classes loaded in response to enumerating 'commands' are marked as named.
    // Classes loaded in response to accessing 'baseClass' are not so marked.
    // Search for 'loadedAsBaseClass'.
    
    // Classes not marked as named are considered un-addressable so cannot
    // have any sub-commands. For this reason, classes not marked as named
    // ignore any sub-command metadata and return no sub-commands.

    // A class could be both a sub-command and a baseClass. In this case, the
    // class should be marked as named and return its sub-commands. To ensure 
    // this class is named it must load as a sub-command *before* it is loaded 
    // as a baseClass. This is done by walking the command hiearchy *first* which has 
    // the effect of loading all named classes before loading any unnamed classes.

    // Before publishing a CLI, the metadata discovered by this eager walk will
    // be serialized to a file. This file will be used to load the metadata
    // when the CLI is executed without requiring loading any node packages.

    const classes = []

    // load named classes; commands
    const stack = [rootMd]
    while (stack.length) {
      const classMd = stack.pop()
      for await (const [_, commandMd] of classMd.commands()) {
        stack.push(commandMd)
        classes.push(commandMd)
      }
    }

    // load unnamed classes; baseClasses
    for (let classMd of classes) {
      while (classMd)
        classMd = await classMd.baseClass
    }

    return rootMd
  }

  #loader
  #pojo
  #parameters
  #baseClassFn
  #commandsFn
  #servicesFn

  constructor(loader, id, name, {
    baseClassFn,
    commandsFn,
    servicesFn,
    ...pojo
  }) {
    super(name)

    this.#loader = loader ?? this
    this.#pojo = pojo
    this.#baseClassFn = baseClassFn
    this.#commandsFn = commandsFn
    this.#servicesFn = servicesFn

    this.id = id
    this.ref = [this.id, this.name]

    this.#parameters = new LazyGenerator(function* () {
      const parameters = this.#pojo.parameters ?? { }
      for (const [name, pojo] of Object.entries(parameters)) {
        yield CliParameterMetadata.create(this, name, pojo)
      }
    }, this)
  }

  isWellKnownClass$(class$) {
    if (this.wellKnown && this.name == class$.name) 
      return true 
    return this.baseClass?.isWellKnownClass$(class$) 
  }

  get loader() { return this.#loader }
  get isClass() { return true }
  get isCommand() { return this.isWellKnownClass$(CliCommand) }
  get isService() { return this.isWellKnownClass$(CliProvider) }
  get isCli() { return this.isWellKnownClass$(Cli) }
  get baseClass() { return this.#baseClassFn() }

  get description() { return this.#pojo.description }
  get defaultCommand() { return this.#pojo.defaultCommand }
  get wellKnown() { return this.#pojo.wellKnown }

  *hierarchy() {
    yield this
    if (this.baseClass)
      yield* this.baseClass.hierarchy()
  }

  async *commands() { yield* this.#commandsFn() }
  async *services() { yield* this.#servicesFn() }
  *parameters() { yield* this.#parameters.value }
}

export class CliMetadataLoader extends CliClassMetadata {
  #cache
  #loaded

  constructor(classOrPojo, id, name, {
    baseClassFn,
    commandsFn,
    servicesFn,
    ...pojo
  }) {
    super(null, id, name, { baseClassFn, commandsFn, servicesFn, ...pojo })

    this.#cache = new Map()
    this.#cache.set(classOrPojo, this)
    this.#loaded = [this]
  }

  activate$(classOrPojo, id) { throw 'abstract' }

  load$(classOrPojo, options) {
    if (!this.#cache.has(classOrPojo)) {
      const metadata = this.activate$(classOrPojo, this.#loaded.length, options)
      this.#loaded.push(metadata)
      this.#cache.set(classOrPojo, metadata)
    }

    return this.#cache.get(classOrPojo)
  }

  async *classes() {
    for(let id = 0; id < this.#loaded.length; id++)
      yield this.#loaded[id]
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
  static getInjections(class$, loadedAsBaseClass = false) {
    return { 
      wellKnown: class$ == Cli ||
          class$ == CliProvider ||
          class$ == CliCommand,
      baseClassFn: function() { 
        assert(this instanceof CliClassMetadata)

        const baseClass = Object.getPrototypeOf(class$.prototype).constructor
        return baseClass == Object ? null 
          : this.loader.load$(baseClass, { loadedAsBaseClass: true })
      }, 
      commandsFn: async function*() { 
        assert(this instanceof CliClassMetadata)

        if (loadedAsBaseClass) 
          return

        if (this instanceof CliProvider)
          return

        const commands = await class$.getOwnCommands()
        for (const [name, value] of Object.entries(commands)) {
          const class$ = await value
          yield [name, this.loader.load$(class$)]
        }
      }, 
      servicesFn: async function*() { 
        assert(this instanceof CliClassMetadata)

        for await (const value of class$.getOwnServices()) {
          const class$ = await value
          if (class$ == Cli || class$.prototype instanceof Cli)
            yield this.loader.load$(class$)
        }
      }, 
    }
  }

  constructor(class$) {
    const { name } = class$
    super(class$, 0, name, { 
      ...class$.getOwnMetadata(),
      ...CliMetadataClassLoader.getInjections(class$), 
    })
  }

  activate$(class$, id, { loadedAsBaseClass } = { }) {
    assert(typeof class$ == 'function', `Class ${class$} must be a function.`)
    assert(class$ == Cli || class$.prototype instanceof Cli, 
      `Class ${class$.name} must extend Cli.`)

    const { name } = class$
    return new CliClassMetadata(this, id, name, {
      ...class$.getOwnMetadata(),
      ...CliMetadataClassLoader.getInjections(class$, loadedAsBaseClass), 
    })
  }
}

export class CliMetadataPojoLoader extends CliMetadataLoader {
  static getInjections(poja, pojo) {

    const { 
      baseClass, // [ 42, 'MyBaseClass' ]
      commands,  // { 'my-command': [43, 'MyCommandClass'], ... }
      services,  // [ [44, 'MyGroupClass'], ... ]
    } = pojo

    return { 
      baseClassFn: function() { 
        assert(this instanceof CliClassMetadata)
        return !baseClass ? null : this.loader.load$(poja[baseClass[0]])
      }, 
      commandsFn: async function*() { 
        assert(this instanceof CliClassMetadata)
        for (const [name, ref] of Object.entries(commands ?? { }))
          yield [name, this.loader.load$(poja[ref[0]])]
      }, 
      servicesFn: async function*() { 
        assert(this instanceof CliClassMetadata)
        for (const ref of services ?? [])
          yield this.loader.load$(poja[ref[0]])
      }, 
    }
  }
  
  #poja

  constructor(poja) {
    const pojo = poja[0]
    const { id, name } = pojo

    super(pojo, id, name, {
      ...pojo,
      ...CliMetadataPojoLoader.getInjections(poja, pojo),
    })

    this.#poja = poja
  }

  activate$(pojo) {
    assert(typeof pojo != 'function', `Expected a pojo.`)

    const { id, name } = pojo
    return new CliClassMetadata(this, id, name, {
      ...pojo,
      ...CliMetadataPojoLoader.getInjections(this.#poja, pojo),
    })
  }
}