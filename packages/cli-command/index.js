#!/usr/bin/env node
import { Cli, CliServiceProvider } from '@kingjs/cli'
import { CliReadable, DEV_STDIN } from '@kingjs/cli-readable'
import { CliWritable, DEV_STDOUT, DEV_STDERR } from '@kingjs/cli-writable'
import assert from 'assert'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

export const REQUIRED = undefined

export class CliIn extends CliServiceProvider { 
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

export class CliOut extends CliServiceProvider {
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

export class CliErr extends CliServiceProvider {
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
  static services = { stderr: CliErr }
  static { this.initialize() }

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
      if (this.stderr.count)
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
