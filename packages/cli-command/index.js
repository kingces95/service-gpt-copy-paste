#!/usr/bin/env node
import { Cli } from '@kingjs/cli'
import { CliFdReadable } from '@kingjs/cli-fd-readable'
import { CliFdWritable } from '@kingjs/cli-fd-writable'
import assert from 'assert'
import { 
  readChar, readString, read, readArray, readRecord, splitRecord, splitArray
} from '@kingjs/cli-read'
import { 
  write, joinFields 
} from '@kingjs/cli-echo'

const DEFAULT_IFS = ' '
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

const IFS = DEFAULT_IFS
const Commands = Symbol('commands')

export const REQUIRED = undefined

export class CliErr extends CliFdWritable { 
  static STDERR_FD = 2
  constructor() { 
    super({ fd: CliErr.STDERR_FD })
  }
}

export class CliOut extends CliFdWritable { 
  static STDOUT_FD = 1
  constructor() { 
    super({ fd: CliOut.STDOUT_FD }) 

    this.isTTY = process.stdout.isTTY
  }
}

export class CliIn extends CliFdReadable { 
  static STDIN_FD = 0
  constructor() { 
    super({ fd: CliIn.STDIN_FD }) 
  }
}

export class CliCommand extends Cli {

  static parameters = {
    help: 'Show help',
    version: 'Show version number',
    verbose: 'Provide verbose output',
  }
  static aliases = {
    help: ['h'],
    version: ['v'],
  }
  static services = [ CliIn, CliOut, CliErr ]
  static { this.initialize() }

  static async loadOwnCommand$(value) {
    const type = typeof value
    switch (type) {
      case 'function':
      case 'string':
        return await this.loadClass$(value)
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
    // that returns any of the above. A function allows for forward references.
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

  static async getCommand(nameOrNames = []) {
    const names = Array.isArray(nameOrNames) ? [...nameOrNames] : [nameOrNames]

    let current = this
    for (const name of names) {
      const commands = await current.getOwnCommands()
      current = await commands[name]
      if (!current) throw new Error(`Command '${name}' not found`)
    }
    return current
  }

  static extend({ name = 'annon', commands, ctor, handler, ...metadata } = { }) {
    if (!name) throw new Error(`Class must have a name`)

    const cls = class extends this {
      constructor(...args) {
        if (cls.initializing(new.target, ...args))
          return super()

        super(...args)

        handler?.call(this, ...args)
      }
    }
    cls.initialize()
    Object.defineProperty(cls, "name", { value: name });
    cls.commands = commands

    const knownKeys = ['name', 'ctor', 'commands', 'handler']
    for (const [key, value] of Object.entries(metadata)) {
      if (knownKeys.includes(key))
        continue
      cls[key] = value
    }
  
    return cls
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

  constructor({ 
    help = false, 
    version = '0.0', 
    verbose = false, 
    ...rest 
  } = { }) {
    if (CliCommand.initializing(new.target, { help, version, verbose }))
      return super()
    
    super({ ...rest })

    // handle graceful shutdown
    this.exitCode = undefined
    process.once('beforeExit', async () => {
      process.exitCode = this.exitCode
    })
    
    // handle ungraceful shutdown
    this.exitError = undefined
    process.once('uncaughtException', (error) => {
      this.error$(error)
    })

    process.once('unhandledRejection', (reason) => {
      this.error$(reason)
    })
  }

  get stdin() { return this.getService(CliIn) }
  get stdout() { return this.getService(CliOut) }
  get stderr() { return this.getService(CliErr) }

  async write(line) { return write(this.stdout, this.signal, line) }
  async writeRecord(fields) { return write(CliCommand.joinFields(fields)) }
  
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

// CliCommand.__dumpMetadata()
