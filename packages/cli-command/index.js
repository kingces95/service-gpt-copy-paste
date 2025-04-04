#!/usr/bin/env node
import { Cli, CliServiceProvider, CliService } from '@kingjs/cli'
import { CliReadable, DEV_STDIN } from '@kingjs/cli-readable'
import { CliWritable, DEV_STDOUT, DEV_STDERR } from '@kingjs/cli-writable'
import { CliWriter } from '@kingjs/cli-writer'
import { CliReader, CliParser } from '@kingjs/cli-reader'
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

export class CliConsoleIn extends CliService {
  static services = {
    stdin: CliStdIn,
    parser: CliParser,
  }
  static { this.initialize(import.meta) }

  #reader
  #stdin
  #parser

  constructor(options) {
    if (CliConsoleIn.initializing(new.target))
      return super()
    super(options)

    const { stdin, parser } = this.getServices(CliConsoleIn, options)
    this.#stdin = stdin
    this.#parser = parser
    this.#reader = stdin.then(stdin => new CliReader(stdin, parser))
  }

  get stdin() { return this.#stdin }
  get parser() { return this.#parser }

  async readByte() { return (await this.#reader).readByte() }
  async readString(charCount) { return (await this.#reader).readString(charCount) }
  async readChar() { return (await this.#reader).readChar() }
  async read() { return (await this.#reader).read() }
  async readArray() { return (await this.#reader).readArray() }
  async readRecord(fields) { return (await this.#reader).readRecord(fields) }
}

export class CliConsoleOut extends CliService {
  static services = { 
    stdout: CliStdOut 
  }
  static { this.initialize(import.meta) }

  #stdout
  #writer

  constructor(options) {
    if (CliConsoleOut.initializing(new.target))
      return super()
    super(options)

    const { stdout } = this.getServices(CliConsoleOut, options)
    this.#stdout = stdout
    this.#writer = stdout.then(stdout => new CliWriter(stdout))
  }

  get stdout() { return this.#stdout }

  async echo(line) { (await this.#writer).echo(line) }
  async echoRecord(fields, separator = ' ') { 
    (await this.#writer).echoRecord(fields, separator) 
  }
}

export class CliConsole extends CliService {
  static services = {
    consoleIn: CliConsoleIn,
    consoleOut: CliConsoleOut,
  }
  static { this.initialize(import.meta) }

  #consoleIn
  #consoleOut

  constructor(options) {
    if (CliConsole.initializing(new.target))
      return super()
    super(options)
    const { consoleIn, consoleOut } = this.getServices(CliConsole, options)
    this.#consoleIn = consoleIn
    this.#consoleOut = consoleOut
  }

  get stdin() { return this.#consoleIn.stdin }
  get parser() { return this.#consoleIn.parser }
  get stdout() { return this.#consoleOut.stdout }
  
  async readByte() { return await this.#consoleIn.readByte() }
  async readString(charCount) { return await this.#consoleIn.readString(charCount) }
  async readChar() { return await this.#consoleIn.readChar() }
  async read() { return await this.#consoleIn.read() }
  async readArray() { return await this.#consoleIn.readArray() }
  async readRecord(fields) { return await this.#consoleIn.readRecord(fields) }

  async echo(line) { await this.#consoleOut.echo(line) }
  async echoRecord(fields, separator = ' ') {
    await this.#consoleOut.echoRecord(fields, separator)
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

    const abortController = new AbortController()
    this.signal = abortController.signal
    process.once('SIGINT', async () => { abortController.abort() })

    // handle graceful shutdown
    this.exitCode = undefined
    process.once('beforeExit', async () => { process.exitCode = this.exitCode })

    // handle ungraceful shutdown
    this.exitError = undefined
    process.once('uncaughtException', (error) => { this.error$(error) })
    process.once('unhandledRejection', (reason) => { this.error$(reason) })
  }

  async success$() { this.exitCode = EXIT_SUCCESS }
  async abort$() { this.exitCode = EXIT_SIGINT }
  async fail$(code = EXIT_FAILURE) { this.exitCode = code }
  async error$(error) {
    this.exitError = error
    this.exitCode = EXIT_ERRORED
    error = error instanceof Error ? error : new Error(error || 'Internal error')
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
