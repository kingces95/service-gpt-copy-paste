import { CliService } from '@kingjs/cli-service'
import { CliWriter } from '@kingjs/cli-writer'
import { CliReader, CliParser } from '@kingjs/cli-reader'
import { CliStdIn, CliStdOut, CliStdMon } from '@kingjs/cli-std-stream'

export const REQUIRED = undefined

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

export class CliConsoleMon extends CliService {
  static services = { 
    stdmon: CliStdMon 
  }
  static { this.initialize(import.meta) }

  #writer

  constructor(options) {
    if (CliConsoleMon.initializing(new.target))
      return super()
    super(options)

    const { stdmon } = this.getServices(CliConsoleMon, options)
    this.#writer = stdmon.then(stdmon => new CliWriter(stdmon))
  }

  #defaultMessage(state) {
    return state.charAt(0).toUpperCase() + state.slice(1) + '...'
  }

  async update(...fields) { await (await this.#writer).echoRecord(fields, ' ') }
  async warnThat(name, message = this.#defaultMessage(name)) { 
    await this.update('warning', name, message) 
  }
  async is(name, message = this.#defaultMessage(name)) { 
    await this.update(name, message) 
  }  
}

// CliCommand.__dumpMetadata()
