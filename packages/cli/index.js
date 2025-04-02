#!/usr/bin/env node
import { trimPojo } from '@kingjs/pojo-trim'
import { NodeName } from '@kingjs/node-name'
import { Lazy, LazyGenerator } from '@kingjs/lazy'
import { LoadAsync, LoadAsyncGenerator } from '@kingjs/load'
import { cliTypeof } from '@kingjs/cli-typeof'
import { getOwn } from '@kingjs/get-own'
import { nodeNameFromMetaUrl } from '@kingjs/node-name-from-meta-url' 
import assert from 'assert'
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
const OwnGroups = Symbol('Cli.OwnGroups')
const Hierarchy = Symbol('Cli.Hierarchy')
const BaseClass = Symbol('Cli.BaseClass')
const ModuleName = Symbol('Cli.ModuleName')
const Meta = Symbol('Cli.Meta')

export class Cli {
  static async __dumpMetadata() { 
    const { toPojo, dumpPojo } = await __import()
    await dumpPojo(await toPojo(this.ownMetadata))
  }

  static async loadClass(nameOrFunction) {
    if (typeof nameOrFunction == 'function') return nameOrFunction

    const value = nameOrFunction
    if (value instanceof NodeName) 
      return Cli.loadOrDeclareClass([nameOrFunction, await value.importObject()]) 

    if (typeof value != 'string')
      throw new Error(`Cannot load class from ${value}`)

    return await NodeName.loadClass(value)
  }
  static async loadOrDeclareClass(entry) {
    const [name, value] = entry

    if (typeof value == 'function') return value

    if (value instanceof NodeName || typeof value == 'string')
      return await Cli.loadClass(value)

    if (typeof value != 'object')
      throw new Error(`Cannot load class from ${value}`)

    return this.extend({ name, ...value })
  }
  static extend({ name, handler, ...rest } = { }) {
    if (!name) throw new Error(`Class must have a name`)
      
    const className = `${this.name}${name[0].toUpperCase() + name.slice(1)}`
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
    
    extension.initialize(this[Meta])
    
    return extension
  }

  static get ownMetadata() { return this[OwnMetadata].value }
  static get baseClass() { return this[BaseClass].value } 
  static *hierarchy() { yield* this[Hierarchy].value }
  static async getModuleName() { return await this[ModuleName].load() }
  
  static async *ownGroups() { yield* await this[OwnGroups].load() }

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
  
  static *ownServiceNames() {
    const services = getOwn(this, 'services') ?? {}
    yield* Object.keys(services)
  }
  static getOwnService(name) {
    const services = getOwn(this, 'services') ?? {}
    const class$ = services[name]
    if (!class$) throw new Error(`Service '${name}' not found`)
    if (!(class$.prototype instanceof CliService) &&
        !(class$.prototype instanceof CliServiceProvider))
      throw new Error(`Class ${class$.name} must extend ${CliService.name} or ${CliServiceProvider.name}.`)
    return class$
  }

  static initialize(meta) {
    assert(!Object.hasOwn(this, 'defaults'))
    // By construction, when any Cli is *first* activated, it will
    // return an array of default positional arguments with an additional 
    // last element which is an object of default option arguments.
    this.defaults = new this()
    
    if (!meta) throw new Error(`Meta is required`)
    this[Meta] = meta

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

    this[ModuleName] = new LoadAsync(async () => {
      const nodeName = await nodeNameFromMetaUrl(this[Meta].url)
      return nodeName.moduleName
    }, this)

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
          .map(([name, value]) => [name, this.loadOrDeclareClass([name, value])])
      )
    }, this)

    this[OwnGroups] = new LoadAsyncGenerator(async function*() {
      // (1) class
      // (2) import string of a class
      // e.g. static groups = [ 'MyGroup', 
      // ' @myScope/service-a', '@myScope/service-b', ServiceC ]
      const groups = getOwn(this, 'groups') ?? []

      // yield arrays where the first element is a class and the remaining
      // elements are resolved classes. Make use of this.loadClass(name)
      for (const [name, ...rest] of groups) {
        const promises = rest.map(o => this.loadClass(o))
        const classes = await Promise.all(promises)
        if (classes.length == 0) continue
        const result = [name, ...classes]
        yield result
      }
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

  static { this.initialize(import.meta) }
 
  #info

  constructor({ _info } = {}) {
    if (Cli.initializing(new.target, { })) {
      const defaults = new.target[OwnDefaults]
      delete new.target[OwnDefaults]
      return defaults
    }

    this.#info = _info
  }

  getServices(class$, options) { return this.info.getServices(class$, options) }
  get info() { return this.#info }
}

export class CliService extends Cli {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliService.initializing(new.target, { })) 
      return super()

    super(options)
  }
}

export class CliServiceProvider extends Cli {
  static { this.initialize(import.meta) }

  constructor(options) {
    if (CliServiceProvider.initializing(new.target, { })) 
      return super()

    super(options)
  }

  activate() { return this }
}

// Cli.__dumpMetadata()
