#!/usr/bin/env node
import { Cli, CliServiceProvider, CliService } from '@kingjs/cli'
import { CliReadable, DEV_STDIN } from '@kingjs/cli-readable'
import { CliWritable, DEV_STDOUT, DEV_STDERR } from '@kingjs/cli-writable'
import { CliEcho } from '@kingjs/cli-echo'
import assert from 'assert'

const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1
const EXIT_ERRORED = 2
const EXIT_ABORT = 128
const EXIT_SIGINT = EXIT_ABORT + 2

export const REQUIRED = undefined

export class CliStdStream extends CliServiceProvider {
  static { this.initialize(import.meta) }
  static group = 'Standard Streams'

  #path
  #isReadable

  constructor(options, { path, isReadable } = { }) {
    if (CliStdStream.initializing(new.target))
      return super()
    super(options)

    this.#path = path
    this.#isReadable = isReadable
  }

  async activate() {
    return await this.#isReadable 
      ? CliReadable.fromPath(this.#path)
      : CliWritable.fromPath(this.#path)
  }
}

export class CliStdIn extends CliStdStream { 
  static parameters = { stdin: 'Input stream'}
  static { this.initialize(import.meta) }

  constructor({ stdin = DEV_STDIN, ...rest } = { }) { 
    if (CliStdIn.initializing(new.target, { stdin })) 
      return super()
    super(rest, { path: stdin, isReadable: true })
  }
}

export class CliStdOut extends CliStdStream {
  static parameters = { stdout: 'Output stream' }
  static { this.initialize(import.meta) }

  constructor({ stdout = DEV_STDOUT, ...rest } = { }) {
    if (CliStdOut.initializing(new.target, { stdout }))
      return super()
    super(rest, { path: stdout })
  }

  async activate() {
    const stdout = await super.activate()
    stdout.isTTY = process.stdout.isTTY
    return stdout
  }
}

export class CliStdErr extends CliStdStream {
  static parameters = { stderr: 'Error stream' }
  static { this.initialize(import.meta) }

  constructor({ stderr = DEV_STDERR, ...rest } = { }) {
    if (CliStdErr.initializing(new.target, { stderr }))
      return super()
    super(rest, { path: stderr })
  }
}

export class CliStdLog extends CliStdStream { 
  static parameters = { stdlog: 'Status stream' }
  static { this.initialize(import.meta) }

  constructor({ stdlog = DEV_STDOUT, ...rest } = { }) { 
    if (CliStdLog.initializing(new.target, { stdlog })) 
      return super()
    super(rest, { path: stdlog })
  }
}

export class CliConsole extends CliService {
  static services = { 
    stdout: CliStdOut 
  }
  static { this.initialize(import.meta) }

  #out

  constructor(options) {
    if (CliConsole.initializing(new.target))
      return super()
    super(options)

    const { stdout } = this.getServices(CliConsole, options)
    this.#out = new CliEcho(stdout)
  }

  async echo(line) { 
    await this.#out.echo(line)
  }
  async echoRecord(fields, separator = ' ') {
    await this.#out.echoRecord(fields, separator)
  }

}

export class CliCommand extends Cli {
  static parameters = {
    help: 'Show help',
    version: 'Show version',
    verbose: 'Provide verbose output',
  }
  static aliases = {
    help: ['h'],
    version: ['v'],
  }
  static services = {
    stderr: CliStdErr 
  }
  static { this.initialize(import.meta) }

  #stderr

  constructor({ 
    help = false, 
    version = '0.0', 
    verbose = false, 
    ...rest 
  } = { }) {
    if (CliCommand.initializing(new.target, { help, version, verbose }))
      return super()
    super({ ...rest })

    const { stderr } = this.getServices(CliCommand, rest)
    this.#stderr = stderr

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
      if (this.#stderr.count)
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
