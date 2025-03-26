#!/usr/bin/env node
import { trimPojo } from '@kingjs/pojo-trim'
import { NodeName } from '@kingjs/node-name'
import { Lazy, LazyGenerator } from '@kingjs/lazy'
import { LoadAsync } from '@kingjs/load'
import { cliTypeof } from '@kingjs/cli-typeof'
import { getOwn } from '@kingjs/get-own'
import { IdentifierStyle } from '@kingjs/identifier-style'
import assert from 'assert'
import { CliOut } from '@kingjs/cli-command'
async function __import() {
  const { cliMetadataToPojo } = await import('@kingjs/cli-metadata-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliMetadataToPojo, dumpPojo }
}

const REQUIRED = undefined
const PARAMETER_METADATA_NAMES =  [
  // arrays
  'aliases', 'choices', 'conflicts', 'implications',
  // functions
  'coerce',
  // strings
  'defaultDescription',
  // booleans
  'hidden', 'local', 'normalize',
]

const OwnDefaults = Symbol('Cli.OwnDefaults')
const OwnMetadata = Symbol('Cli.OwnMetadata')
const OwnCommands = Symbol('Cli.OwnCommands')
const OwnDiscriminatingOption = Symbol('Cli.OwnDiscriminatingOption')
const Hierarchy = Symbol('Cli.Hierarchy')
const BaseClass = Symbol('Cli.BaseClass')

export class Cli {
  static async __dumpMetadata() { 
    const { toPojo, dumpPojo } = await __import()
    await dumpPojo(await toPojo(this.ownMetadata))
  }

  static async loadClass(entry) {
    const [name, value] = entry
    if (value instanceof NodeName) 
      return Cli.loadClass([name, await value.importObject()]) 

    if (typeof value == 'object')
      return this.extend({ name, ...value })

    return await NodeName.loadClass(value)
  }
  static extend({ name, handler, ...rest } = { }) {
    if (!name) throw new Error(`Class must have a name`)

    const className = `${this.name}_${name}`
    const extension = new Function('base', 'handler', [
      `return class ${className} extends base {`,
      `  constructor(...args) {`,
      `    if (${className}.initializing(new.target, ...args))`,
      `      return super()`,
      ``,
      `    super(...args)`,
      `    handler?.call(this, ...args)`,
      `  }`,
      `}`
    ].join('\n'))(this, handler)

    for (const [key, value] of Object.entries(rest)) 
      extension[key] = value
    
    extension.initialize()
    
    return extension
  }

  static get ownMetadata() { return this[OwnMetadata].value }
  static get baseClass() { return this[BaseClass].value } 
  static *hierarchy() { yield* this[Hierarchy].value }
  
  static async *ownCommandNames() { yield* Object.keys(await this[OwnCommands].load()) }
  static async getCommand(...names) {
    if (names.length == 0)
      return this

    const [name, ...rest] = names
    const commands = await this[OwnCommands].load()
    const command = await commands[name]
    if (!command) throw new Error(`Command '${name}' not found`)
    return command.getCommand(...rest)
  }
  static async getRuntimeCommand(...kebabNames) {
    const names = kebabNames.map(o => IdentifierStyle.fromKebab(o).toCamel())
    return this.getCommand(...names) 
  }
  
  static get ownDiscriminatingOption() { return this[OwnDiscriminatingOption].value }
  static async getRuntimeClass(options) {
    if (!this.ownDiscriminatingOption) return this

    const [name, discriminations] = this.ownDiscriminatingOption
    const discriminator = options[name]
    const importOrObject = discriminations[discriminator]
    if (!importOrObject) return this

    // runtime class must be a derivation enclosing class
    const class$ = await this.loadClass([name, importOrObject])
    if (class$ != this && !(class$.prototype instanceof this))
      throw new Error(`Class ${class$.name} must extend ${this.name}`)
    return class$
  }

  static *getOwnServiceProviderClasses() { 
    yield* Object.entries(getOwn(this, 'services') ?? { })
  }
  static *getServiceProviderClasses({
    visited = new Set(),
    recurse = false,
  } = { }) {
    const baseClass = this.baseClass
    if (baseClass)
      yield* baseClass.getServiceProviderClasses({visited, recurse})

    for (const [name, class$] of this.getOwnServiceProviderClasses()) {
      if (visited.has(class$)) continue
      visited.add(class$)
      if (!(class$.prototype instanceof CliServiceProvider))
        throw new Error(`Service ${class$.name} must extend ${CliServiceProvider.name}`)
      if (recurse)
        yield* class$.getServiceProviderClasses({visited, recurse})
      yield [name, class$]
    }
  }

  static initialize() {
    assert(!Object.hasOwn(this, 'defaults'))

    // By construction, when any Cli is *first* activated, it will
    // return an array of default positional arguments with an additional 
    // last element which is an object of default option arguments.
    this.defaults = new this()

    const getOwnParameterMetadata = (name, metadata) => {
      PARAMETER_METADATA_NAMES.reduce((acc, metadataName) => {
        acc[metadataName] = (getOwn(this, metadataName) ?? { })[name]
        return acc
      }, metadata)
  
      // choices is an array that usually contains a list of strings but can
      // also contain an object. If it contains an object, then the object is
      // a discriminator that selects a class to activate. The discriminator
      // is only used at activation time so we project only its keys into the
      // metadata.
      const choices = metadata.choices
      if (choices && !Array.isArray(choices))
        metadata.choices = Object.keys(choices)
  
      // e.g. [[], { myOption: 42 }] is one variadic positional parameter
      // and one optional option parameter with a default value of 42.
      // Assume the variadic is the parameter whose metadata we are building.
      const isPositional = metadata.position !== undefined
      const isArray = Array.isArray(metadata.default)
      if (isPositional && isArray)
        metadata.variadic = true
  
      const defaultOrArrayDefault = 
        // e.g. [[], { myOption: 42 }] vs [[REQUIRED], { myOption: 42 }]
        // The former is an optional variadic positional parameter.
        // The latter is a required variadic positional parameter.
        // We extract a default of null from [] and REQUIRED from [REQUIRED].
        isArray ? (metadata.default.length == 0 ? null : metadata.default[0]) :
        metadata.default
  
      const hasDefault = defaultOrArrayDefault !== REQUIRED
      if (isPositional && hasDefault) metadata.optional = true
      if (!isPositional && !hasDefault) metadata.required = true
  
      // compute the type of the parameter.
      metadata.type = cliTypeof(defaultOrArrayDefault)
  
      return metadata
    }

    this[OwnMetadata] = new Lazy(() => {
      const description = getOwn(this, 'description')
      const defaultCommand = getOwn(this, 'defaultCommand')
  
      const defaults = Array.isArray(this.defaults) ? this.defaults : [this.defaults]
      const lastDefault = defaults[defaults.length - 1]
      const hasOptionDefaults = 
        typeof lastDefault == 'object' && !Array.isArray(lastDefault)
      const optionDefaults = hasOptionDefaults ? lastDefault : { }
      const positionalCount = defaults.length - (hasOptionDefaults ? 1 : 0)
  
      const parameters = getOwn(this, 'parameters') ?? []
      const positionals = Object.fromEntries(
        Object.entries(parameters)
          .slice(0, positionalCount)
          .map(([name, description], i) => [name, getOwnParameterMetadata(name, {
            position: i,
            description,
            default: defaults[i],
          })])
        )
  
      const options = Object.fromEntries(
        Object.entries(optionDefaults)
          .map(([name, default$]) => [name, getOwnParameterMetadata(name, {
            description: parameters[name],
            default: default$,
          })])
        )
  
      const metadata = trimPojo({ 
        name: this.name,
        description,
        defaultCommand,
        parameters: { ...positionals, ...options },
      })

      return metadata
    }, this)

    this[OwnDiscriminatingOption] = new Lazy(() => {
      // If this command (or group) has an option with a choice constraint, 
      // then that option can be used as a discriminator to select an alternative
      // command to activate.

      // a choice which is an object (instead of array) is a discriminator. 
      const choices = getOwn(this, 'choices') ?? { 
        // myOption: [ 'left', 'right' ],
        // myDiscriminator: { foo: @kingjs/mycmd/foo, bar: @kingjs/mycmd/bar }
      }

      return Object.entries(choices).find(([_, value]) => typeof value == 'object')
    }, this)

    this[OwnCommands] = new LoadAsync(async () => {
      // (1) class
      // (2) import string of a class
      // (3) directory path
      // (4) POJO representing a class 
      // (5) a possibly async function that returns any of the above.
      const commandsOrFn = getOwn(this, 'commands') ?? { }

      // A function allows for forward references.
      const commands = typeof commandsOrFn == 'function' 
        ? await commandsOrFn() : await commandsOrFn

      // return a map of promises
      return Object.fromEntries(
        Object.entries(commands)
          .map(([name, value]) => [name, this.loadClass([name, value])])
      )

    }, this)

    this[BaseClass] = new Lazy(() => {
      const baseClass = Object.getPrototypeOf(this.prototype).constructor
      if (baseClass == Object) return null
      return baseClass
    }, this)

    this[Hierarchy] = new LazyGenerator(function* () {
      yield this
      const baseClass = this[BaseClass].value
      if (baseClass)
        yield* baseClass.hierarchy()
    }, this)
  }

  static initializing(newTarget, ...defaults) {
    if (Object.hasOwn(newTarget, 'defaults')) return false
    if (this == newTarget) newTarget[OwnDefaults] = defaults
    return true
  }

  static { this.initialize() }
 
  #services

  constructor({ _services } = {}) {
    if (Cli.initializing(new.target, { })) {
      const defaults = new.target[OwnDefaults]
      delete new.target[OwnDefaults]
      return defaults
    }
    assert(_services)
    this.#services = _services

    // assign services by name to this
    for (const [name, service] of this.constructor.getServiceProviderClasses())
      this[name] = _services.get(service)
  }

  getService(provider) { return this.#services.get(provider) }
}

export class CliServiceProvider extends Cli {
  static { this.initialize() }

  constructor(options) {
    if (CliServiceProvider.initializing(new.target, { })) 
      return super()

    super(options)
  }

  activate() { return this }
}

// Cli.__dumpMetadata()
