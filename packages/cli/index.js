#!/usr/bin/env node
import { Console } from 'console'
import { readChar, readString, read, readArray, readRecord } from '@kingjs/cli-read'
import { splitRecord, splitArray } from '@kingjs/cli-read'
import { write, joinFields } from '@kingjs/cli-echo'
import { CliFdReadable } from '@kingjs/cli-fd-readable'
import { CliFdWritable } from '@kingjs/cli-fd-writable'
import { NodeName } from '@kingjs/node-name'
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

const DEFAULT_IFS = ' '
const STDIN_FD = 0
const STDOUT_FD = 1
const STDERR_FD = 2
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

const IFS = DEFAULT_IFS
const Metadata = Symbol('metadata')
const Commands = Symbol('commands')

export const REQUIRED = undefined

export class Cli {

  static async __dumpMetadata() { 
    const { toPojo, dumpPojo } = await __import()
    const metadata = await this.getOwnMetadata()
    const pojo = await toPojo(metadata)
    await dumpPojo(pojo)
  }

  static parameters = {
    help: 'Show help',
    version: 'Show version number',
    verbose: 'Provide verbose output',
  }
  static aliases = {
    help: ['h'],
    verbose: ['v'],
  }
  static defaults = Cli.loadDefaults()

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

    // Determine if a positional is optional or an option is required. The
    // presence of a default is insufficient since a string can be null
    // and null defaults are difficult to deal with (e.g. they are trimmed).
    const isArray = Array.isArray(metadata.default)
    const isPositional = metadata.position !== undefined
    if (isPositional && isArray)
      metadata.variadic = true

    const default$ = 
      !isArray ? metadata.default : 
      metadata.default.length == 0 ? null : metadata.default[0]
    const hasDefault = default$ !== undefined
    if (isPositional && hasDefault)
      metadata.optional = true
    if (!isPositional && !hasDefault)
      metadata.required = true

    return metadata
  }

  static async loadOwnCommand$(value) {

    const type = typeof value
    switch (type) {
      case 'function':
        return value
      case 'string':
        const object = await NodeName.from(value).importObject()
        if (!object) throw new Error(`Could not load command ${value}`)
        return await this.loadOwnCommand$(object)
      case 'object':
        return this.extend({ ...value })
    }
    throw new Error(`Could not load command`)
  }

  static async getOwnCommands() {
    if (this.getOwnPropertyValue$(Commands))
      return this[Commands]

    // a (1) class, (2) import string of a class, (3) directory path, 
    // or (4) POJO representing a class or (5) a possibly async function 
    // that returns any of the above. A function allows for fowrad references.
    const commandsOrFn = this.getOwnPropertyValue$('commands') ?? { }

    const commands = typeof commandsOrFn == 'function' 
      ? await commandsOrFn() : await commandsOrFn

    const map = { }
    for (const [name, value] of Object.entries(commands)) {
      const class$ = this.loadOwnCommand$(value)

      // each class must be a derivation of the enclosing class
      if (!class$.prototype instanceof this)
        throw new Error(`Class ${class$.name} must extend ${this.name}`)

      map[name] = class$
    }

    return this[Commands] = map
  }

  static getOwnMetadata() {
    const description = this.getOwnPropertyValue$('description')

    if (this.getOwnPropertyValue$(Metadata))
      return this[Metadata]

    const lastDefault = this.defaults[this.defaults.length - 1]
    const hasOptionDefaults = 
      typeof lastDefault == 'object' && !Array.isArray(lastDefault)
    const optionDefaults = hasOptionDefaults ? lastDefault : { }
    const positionalCount = this.defaults.length - (hasOptionDefaults ? 1 : 0)

    const parameters = this.getOwnPropertyValue$('parameters') ?? []
    const positionals = Object.fromEntries(
      Object.entries(parameters)
        .slice(0, positionalCount)
        .map(([name, description], i) => [name, this.getOwnParameterMetadata$(name, {
          position: i,
          description,
          default: this.defaults[i],
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

  static async getCommand(path = []) {
    if (path.length == 0) 
      return this

    const [commandName, ...rest] = path
    const commands = await this.getOwnCommands()
    const command = await commands[commandName]
    if (!command)
      throw new Error(`Command ${commandName} not found`)
    return command.getCommand(rest)
  }

  static extend({ name = 'annon', commands, ctor, handler, ...metadata }) {
    if (!name)
      throw new Error(`Class must have a name`)

    const cls = class extends this {
      constructor(...args) {
        if (cls.loadingDefaults(new.target, ...args))
          return super()

        super(...(ctor?.call(new Proxy(() => this, {
          get(self, prop) { return Reflect.get(self(), prop) },
          set(self, prop, value) { return Reflect.set(self(), prop, value) },
          has(self, prop) { return Reflect.has(self(), prop) },
          deleteProperty(self, prop) { return Reflect.deleteProperty(self(), prop) },
          apply(self, thisArg, args) { return Reflect.apply(self(), thisArg, args) }
        }), ...args) || [{ }]))

        handler?.call(this, ...args)
      }
    }
    Object.defineProperty(cls, "name", { value: name });
    cls.commands = commands
    cls.defaults = []

    const knownKeys = ['name', 'ctor', 'commands', 'handler']
    for (const [key, value] of Object.entries(metadata)) {
      if (knownKeys.includes(key))
        continue
      cls[key] = value
    }
  
    return cls
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

  static async splitArray(line) {
    return splitArray(line, IFS)
  }

  static async splitRecord(line, fields) {
    return splitRecord(line, IFS, fields)
  }

  static joinFields(fields) {
    return joinFields(IFS, fields)
  }

  constructor({ help = false, version = '0.0', verbose = false } = {}) {
    if (Cli.loadingDefaults(new.target, { help, version, verbose })) {
      const defaults = new.target[DEFAULTS]
      delete new.target[DEFAULTS]
      return defaults
    }

    // handle graceful shutdown
    this.exitCode = undefined
    process.once('beforeExit', async () => {
      process.exitCode = this.exitCode
    })

    // wrap standard streams
    this.stdin = new CliFdReadable({ fd: STDIN_FD }) // Use stdin file descriptor
    this.stdout = new CliFdWritable({ fd: STDOUT_FD }) // Use stdout file descriptor
    this.stderr = new CliFdWritable({ fd: STDERR_FD }) // Use stdout file descriptor
    this.console = new Console({
      stdout: this.stdout,
      stderr: this.stderr,
      colorMode: true, // Enable color support
    });      
    
    // handle ungraceful shutdown
    this.exitError = undefined
    process.once('uncaughtException', (error) => {
      this.error$(error)
    })

    process.once('unhandledRejection', (reason) => {
      this.error$(reason)
    })
  }

  async write(line) { return write(this.stdout, this.signal, line) }
  async writeRecord(fields) { return write(Cli.joinFields(fields)) }
  
  async readChar() { return readChar(this.stdin, this.signal) }
  async readString(count) { return readString(this.stdin, this.signal, count) }
  async read() { return read(this.stdin, this.signal) }
  async readArray() { return readArray(this.stdin, this.signal, IFS) }
  async readRecord(fields) { return readRecord(this.stdin, this.signal, IFS, fields) }

  async success$() { this.exitCode = EXIT_SUCCESS }
  async abort$() { this.exitCode = EXIT_SIGINT }
  async fail$(code = EXIT_FAILURE) { this.exitCode = code }

  async error$(error) {
    this.exitError = error
    this.exitCode = EXIT_ERRORED
    error = error instanceof Error 
      ? error 
      : new Error(err || 'Internal error')
    console.error(error)
  }

  get running() { return process.exitCode === undefined }
  get succeeded() { return process.exitCode == EXIT_SUCCESS }
  get aborted() { return process.exitCode == EXIT_SIGINT }
  get errored() { return process.exitCode == EXIT_ERRORED }
  get failed() { return process.exitCode == EXIT_FAILURE }

  toString() {
    if (this.succeeded)
      if (this.stderr.count)
        return 'Command succeeded with warnings'
      else
        return 'Command succeeded'
    if (this.aborted)
      return `Command aborted`
    if (this.failed)
      return `Command failed`
    if (this.errored)
      return `Command exception: ${this.exitError}`
    
    assert(this.running)
    return 'Running...'
  }
}

// Cli.__dumpMetadata(import.meta)
