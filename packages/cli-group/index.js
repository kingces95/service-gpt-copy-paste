#!/usr/bin/env node
import { trimPojo } from '@kingjs/pojo-trim'
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

const Metadata = Symbol('metadata')

export class CliGroup {

  static async __dumpMetadata() { 
    const { toPojo, dumpPojo } = await __import()
    const metadata = await this.getOwnMetadata()
    const pojo = await toPojo(metadata)
    await dumpPojo(pojo)
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

  static loadDefaults() {
    assert(!Object.hasOwn(this, 'defaults'))
    const defaults = new this()
    return defaults
  }

  static loadingDefaults(newTarget, ...defaults) {
    if (Object.hasOwn(newTarget, 'defaults'))
      return false

    if (this != newTarget)
      return true
    
    assert(!Object.hasOwn(newTarget, 'defaults'))
    newTarget[DEFAULTS] = defaults
    return true
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

  static initialize() {
    this.defaults = this.loadDefaults()
  }
 
  static { this.initialize() }
 
  constructor({ _info } = {}) {
    if (CliGroup.loadingDefaults(new.target, { })) {
      const defaults = new.target[DEFAULTS]
      delete new.target[DEFAULTS]
      return defaults
    }

    // enable reflection
    this.info = _info
  }

}

// CliGroup.__dumpMetadata()
