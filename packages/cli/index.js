#!/usr/bin/env node
import { readChar, readString, read, readArray, readRecord } from '@kingjs/cli-read'
import { splitRecord, splitArray } from '@kingjs/cli-read'
import { write, joinFields } from '@kingjs/cli-echo'
import { Console } from 'console'
import { CliFdReadable } from '@kingjs/cli-fd-readable'
import { CliFdWritable } from '@kingjs/cli-fd-writable'
import { moduleNameFromMetaUrl } from '@kingjs/node-name-from-meta-url'
import assert from 'assert'
async function __import() {
  const { loader } = await import('@kingjs/cli-metadata')
  const { cliMetadataToPojo } = await import('@kingjs/cli-metadata-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { loader, toPojo: cliMetadataToPojo, dumpPojo }
}

const DEFAULTS = Symbol('defaults loading')
const TYPE_NAME = Symbol('typeName')

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

export class Cli {
  static async __dumpMetadata() { 
    const { loader, toPojo, dumpPojo } = await __import()
    toPojo(loader.load(this)).then(dumpPojo) 
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
  static meta = import.meta

  static async typeName() { 
    if (!Object.hasOwn(this, TYPE_NAME)) {
      if (!this.name || !Object.hasOwn(this, 'meta')) 
        return null
      const moduleName = await moduleNameFromMetaUrl(this.meta?.url) 
      this[TYPE_NAME] = moduleName.type(this.name)
    }
    return this[TYPE_NAME]
  }
  static async moduleName() { return (await this.typeName())?.moduleName }
  static async url() { return (await this.typeName())?.url }
  static async fullName() { return (await this.typeName())?.fullName }

  static extend({ name, ctor, ...metadata }) {
    const cls = class cls extends this {
      constructor(...args) {
        var defaults = ctor?.call() ?? []
  
        if (cls.loadingDefaults(new.target, ...defaults))
          return super()
    
        super(...ctor?.call(this, ...args))
      }
    }
    Object.defineProperty(cls, "name", { value: name });

    const knownKeys = ['name', 'ctor']
    for (const [key, value] of Object.entries(metadata)) {
      if (knownKeys.includes(key))
        continue
      cls[key] = value
    }
  
    cls.defaults = cls.loadDefaults()
  
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

  async write(line) {
    return write(this.stdout, this.signal, line)
  }

  async writeRecord(fields) {
    return write(Cli.joinFields(fields))
  }

  async readChar() {
    return readChar(this.stdin, this.signal)
  }

  async readString(charCount) {
    return readString(this.stdin, this.signal, charCount)
  }

  async read() {
    return read(this.stdin, this.signal)
  }

  async readArray() {
    return readArray(this.stdin, this.signal, IFS)
  }

  async readRecord(fields) {
    return readRecord(this.stdin, this.signal, IFS, fields)
  }

  async success$() {
    this.exitCode = EXIT_SUCCESS
  }

  async abort$() {
    this.exitCode = EXIT_SIGINT
  }

  async fail$(code = EXIT_FAILURE) {
    this.exitCode = code
  }

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

// Cli.__dumpMetadata()
