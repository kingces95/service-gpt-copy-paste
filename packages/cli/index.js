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
  'defaultDescription',
  // booleans
  'hidden', 'local', 'normalize',
]

const Metadata = Symbol('Cli.metadata')
const Groups = Symbol('Cli.groups')

export class Cli {

  static async __dumpMetadata() { 
    const { toPojo, dumpPojo } = await __import()
    const metadata = await this.getOwnMetadata()
    const pojo = await toPojo(metadata)
    await dumpPojo(pojo)
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
      const metadatum = this.getOwnPropertyValue$(metadataName)?.[name]
      if (metadatum !== undefined)
        acc[metadataName] = metadatum
      return acc
    }, metadata)

    // e.g. [[], { myOption: 42 }] is one variadic positional parameter
    // and one optional option parameter with a default value of 42.
    // Assume the variadic is the parameter whose metadata we are building.
    const isPositional = metadata.position !== undefined
    const isArray = Array.isArray(metadata.default)
    if (isPositional && isArray)
      metadata.variadic = true

    // e.g. [[], { myOption: 42 }] vs [[REQUIRED], { myOption: 42 }]
    // The former is an optional variadic positional parameter.
    // The latter is a required variadic positional parameter.
    // We extract a default of null from [] and REQUIRED from [REQUIRED].
    const default$ = 
      isArray ? (metadata.default.length == 0 ? null : metadata.default[0]) :
      metadata.default 

    const hasDefault = default$ !== REQUIRED
    if (isPositional && hasDefault) metadata.optional = true
    if (!isPositional && !hasDefault) metadata.required = true

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

  static async getOwnGroups() {
    if (this.getOwnPropertyValue$(Groups))
      return this[Groups]

    // a (1) class, (2) import string of a class
    const groups = this.getOwnPropertyValue$('groups') ?? []

    const list = []
    for (const value of groups)
      list.push(this.loadClass$(value))

    return this[Groups] = list    
  }

  static async getOwnCommands() { 
    // groups have no commands; commands are, or are composed of, groups
    // to simplify reflection, we return an empty map
    return { }
  }

  static async getCommand(nameOrNames = []) {
    const names = Array.isArray(nameOrNames) ? [...nameOrNames] : [nameOrNames]
    for (const name of names)
      throw new Error(`Command '${name}' not found`)
    return this
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
 
  constructor({ _info } = {}) {
    if (Cli.initializing(new.target, { })) {
      const defaults = new.target[DEFAULTS]
      delete new.target[DEFAULTS]
      return defaults
    }

    // enable reflection
    this.info = _info
  }

}

// Cli.__dumpMetadata()
