#!/usr/bin/env node
import { Cli } from '@kingjs/cli'
import { CliReadable, DEV_STDIN } from '@kingjs/cli-readable'
import { CliWritable, DEV_STDOUT, DEV_STDERR } from '@kingjs/cli-writable'
import { CliProvider } from '@kingjs/cli-provider'
import assert from 'assert'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

const Commands = Symbol('commands')

export const REQUIRED = undefined

export class CliIn extends CliProvider { 
  static parameters = { stdin: 'Input stream'}
  static { this.initialize() }

  #path

  constructor({ stdin = DEV_STDIN, ...rest } = { }) { 
    if (CliIn.initializing(new.target, { stdin })) 
      return super()
    super(rest)

    this.#path = stdin
  }
  
  async activate() { 
    return await CliReadable.fromPath(this.#path)
  }
}

export class CliOut extends CliProvider {
  static parameters = { stdout: 'Output stream' }
  static { this.initialize() }

  #path

  constructor({ stdout = DEV_STDOUT, ...rest } = {}) {
    if (CliOut.initializing(new.target, { stdout }))
      return super()
    super(rest)

    this.#path = stdout
  }

  async activate() {
    const stdout = await CliWritable.fromPath(this.#path)
    stdout.isTTY = process.stdout.isTTY
    return stdout
  }
}

export class CliErr extends CliProvider {
  static parameters = { stderr: 'Error stream' }
  static { this.initialize() }

  #path

  constructor({ stderr = DEV_STDERR, ...rest } = {}) {
    if (CliErr.initializing(new.target, { stderr }))
      return super()
    super(rest)

    this.#path = stderr
  }

  async activate() {
    return await CliWritable.fromPath(this.#path)
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
    if (this.succeeded) {
      const stderr = this.getService(CliErr)
      if (stderr.count)
        return 'Command succeeded with warnings'
      else
        return 'Command succeeded'
    }
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
