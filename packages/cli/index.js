#!/usr/bin/env node
import { trimPojo } from '@kingjs/pojo-trim'
import { NodeName } from '@kingjs/node-name'
import assert from 'assert'

async function __import() {
  const { CliMetadataLoader } = await import('@kingjs/cli-metadata')
  const { cliMetadataToPojo } = await import('@kingjs/cli-metadata-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  const { moduleNameFromMetaUrl } = await import('@kingjs/node-name-from-meta-url')
  return { 
    CliMetadataLoader, 
    toPojo: cliMetadataToPojo, 
    dumpPojo,
    moduleNameFromMetaUrl
  }
}

const REQUIRED = undefined
const DEFAULTS = Symbol('defaults loading')
const PARAMETER_METADATA_NAMES =  [
  // arrays
  'aliases', 'choices', 'conflicts', 'implications',
  // functions
  'coerce',
  // strings
  'defaultDescription', 'services',
  // booleans
  'hidden', 'local', 'normalize',
]

const Metadata = Symbol('Cli.metadata')
const Services = Symbol('Cli.services')

export class Cli {

  static async __dumpMetadata() { 
    const { toPojo, dumpPojo } = await __import()
    const metadata = await this.getOwnMetadata()
    const pojo = await toPojo(metadata)
    await dumpPojo(pojo)
  }
  
  static #getType(default$) {
    if (default$ === undefined) {
      return undefined
    } else if (default$ === null) {
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

  static async loadClass$(value) {
    const type = typeof value
    switch (type) {
      case 'function':
        return value
      case 'string':
        const object = await NodeName.from(value).importObject()
        if (!object) throw new Error(`Could not load class ${value}`)
        return await this.loadOwnCommand$(object)
    }
    throw new Error(`Could not load class`)
  }

  static getOwnPropertyValue$(name) {
    return Object.hasOwn(this, name)
      ? this[name] : null
  }

  static getOwnParameterMetadata$(name, metadata) {
    PARAMETER_METADATA_NAMES.reduce((acc, metadataName) => {
      const value = this.getOwnPropertyValue$(metadataName)
      if (value === undefined || value === null) return acc
      const metadatum = value[name]
      if (metadatum !== undefined)
        acc[metadataName] = metadatum
      return acc
    }, metadata)

    // choices is an array that usually contains a list of strings but can
    // also contain an object. If it contains an object, then the object is
    // a discriminator that selects a class to activate. The discriminator
    // is only used at activation time so we project only its keys into the
    // metadata.
    const choices = metadata.choices
    if (choices && typeof choices == 'object')
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
    metadata.type = Cli.#getType(defaultOrArrayDefault)

    return metadata
  }

  static getOwnMetadata() {
    const description = this.getOwnPropertyValue$('description')
    const defaultCommand = this.getOwnPropertyValue$('defaultCommand')

    if (this.getOwnPropertyValue$(Metadata))
      return this[Metadata]

    const defaults = Array.isArray(this.defaults) ? this.defaults : [this.defaults]
    const lastDefault = defaults[defaults.length - 1]
    const hasOptionDefaults = 
      typeof lastDefault == 'object' && !Array.isArray(lastDefault)
    const optionDefaults = hasOptionDefaults ? lastDefault : { }
    const positionalCount = defaults.length - (hasOptionDefaults ? 1 : 0)

    const parameters = this.getOwnPropertyValue$('parameters') ?? []
    const positionals = Object.fromEntries(
      Object.entries(parameters)
        .slice(0, positionalCount)
        .map(([name, description], i) => [name, this.getOwnParameterMetadata$(name, {
          position: i,
          description,
          default: defaults[i],
        })])
      )

    const options = Object.fromEntries(
      Object.entries(optionDefaults)
        .map(([name, default$]) => [name, this.getOwnParameterMetadata$(name, {
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

    return this[Metadata] = metadata
  }

  static async getOwnServices() {
    if (this.getOwnPropertyValue$(Services))
      return this[Services]

    // a (1) class, (2) import string of a class
    const services = this.getOwnPropertyValue$('services') ?? []

    const list = []
    for (const value of services)
      list.push(this.loadClass$(value))

    return this[Services] = list    
  }

  static async getOwnCommands() { 
    // services have no commands; commands are, or are composed of, services
    // to simplify reflection, we return an empty map
    return { }
  }

  static async getCommand(nameOrNames = []) {
    const names = Array.isArray(nameOrNames) ? [...nameOrNames] : [nameOrNames]
    for (const name of names)
      throw new Error(`Command '${name}' not found`)
    return this
  }

  static async activate(...args) {
    
    // If this command (or group) has an option with a constrained set of choices, 
    // then that option can be used as a discriminator to select an alternative
    // command to activate which is typically a deriviation of this command.

    // a choice which is an object (instead of array) is a discriminator. 
    const choices = this.getOwnPropertyValue$('choices') ?? { 
      // myOption: [ 'left', 'right' ],
      // myDiscriminator: { foo: @kingjs/mycmd/foo, bar: @kingjs/mycmd/bar }
    }
    const [name, discriminations = { }] = Object.entries(choices)
      .find(([_, value]) => typeof value == 'object') ?? [ ]
    
    const options = args.at(-1)
    const discriminator = options[name]
    const className = discriminations[discriminator]
    const class$ = !className ? this : 
      className instanceof NodeName ? await className.importObject() :
      await NodeName.import(className)
    if (!class$) throw new Error(`Faile to load node module ${className}.`)
    
    // allocate shared service array; services is a shared array of cli instances
    if (!options._services) options._services = [ ]

    // activate and register services
    const { _services, ...rest } = options
    for (const service of this.services ?? []) {

      // services are singletons
      if (_services.find(o => o instanceof this)) continue

      _services.push(service.activate 
        // allow activation as a function of options (e.g. choice/discriinator)
        ? await service.activate({ _services, ...rest }) 
        : new service({ _services, ...rest })
      )
    }

    return new class$(...args)
  }

  static get baseCli() {
    const baseClass = Object.getPrototypeOf(this.prototype).constructor
    if (baseClass == Object)
      return null
    return baseClass
  } 

  static *hierarchy() {
    yield this
    const baseCli = this.baseCli
    if (baseCli)
      yield* baseCli.hierarchy()
  }

  static initialize() {
    assert(!Object.hasOwn(this, 'defaults'))

    // By construction, when any Cli is *first* activated, it will
    // return an array of default positional arguments with an additional 
    // last element which is an object of default option arguments.
    this.defaults = new this()
  }

  static initializing(newTarget, ...defaults) {
    if (Object.hasOwn(newTarget, 'defaults'))
      return false

    if (this == newTarget)
      newTarget[DEFAULTS] = defaults

    return true
  }
 
  static { this.initialize() }
 
  #services
  #info

  constructor({ _services = [], _info } = {}) {
    if (Cli.initializing(new.target, { })) {
      const defaults = new.target[DEFAULTS]
      delete new.target[DEFAULTS]
      return defaults
    }
    this.#services = _services
    this.#info = _info
  }

  getService(type) { return this.#services.find(o => o instanceof type) }
  get info() { return this.#info }
}

// Cli.__dumpMetadata()
