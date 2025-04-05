#!/usr/bin/env node
import { Cli, CliServiceProvider, CliService } from '@kingjs/cli'
import { CliReadable, DEV_STDIN } from '@kingjs/cli-readable'
import { CliWritable, DEV_STDOUT } from '@kingjs/cli-writable'
import { CliWriter } from '@kingjs/cli-writer'
import { CliReader, CliParser } from '@kingjs/cli-reader'
import assert from 'assert'


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

  from(streamStringOrGenerator) { 
    return CliReader.from(streamStringOrGenerator, this.#parser)
  }
  fromPath(path) { 
    return CliReader.fromPath(path, this.#parser)
  }

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
  static { this.initialize(import.meta) }

  constructor({ 
    help = false, 
    version = '0.0', 
    verbose = false, 
    ...rest 
  } = { }) {
    if (CliCommand.initializing(new.target, { help, version, verbose }))
      return super()
    super({ ...rest })
  }

  async execute(signal) { return true }

  toString() { this.runtime.toString() }
}

// CliCommand.__dumpMetadata()
