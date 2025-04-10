import { CliService, CliServiceThread } from '@kingjs/cli-service'
import { CliWriter } from '@kingjs/cli-writer'
import { CliReader, CliParser } from '@kingjs/cli-reader'
import { CliStdIn, CliStdOut, CliStdMon } from '@kingjs/cli-std-stream'
import { PassThrough } from 'stream'

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

    const { stdin, parser } = this.getServices(CliConsoleIn)
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

    const { stdout } = this.getServices(CliConsoleOut)
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
    const { consoleIn, consoleOut } = this.getServices(CliConsole)
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

export class CliConsoleMon extends CliServiceThread {
  static services = { 
    stdmon: CliStdMon 
  }
  static consumes = [ 'update', 'warnThat', 'is' ]
  static { this.initialize(import.meta) }

  #writer
  #stream

  constructor(options) {
    if (CliConsoleMon.initializing(new.target))
      return super()
    super(options)

    const { stdmon } = this.getServices(CliConsoleMon)
    this.#writer = stdmon.then(stream => new CliWriter(stream))
    this.#stream = new PassThrough({ objectMode: true })

    this.on('update', (...items) => {
      this.#stream.write(items)
    })
    this.on('warnThat', (status, note = this.#defaultMessage(status)) => {
      this.#stream.write(['warning', status, note])
    })
    this.on('is', (status, note = this.#defaultMessage(status)) => {
      this.#stream.write([status, note])
    })
  }

  #defaultMessage(status) {
    return status.charAt(0).toUpperCase() + status.slice(1) + '...'
  }

  update(...items) {
    this.#stream.write(items)
  }

  warnThat(status, note = this.#defaultMessage(status)) { 
    this.update('warning', status, note) 
  }

  is(status, note = this.#defaultMessage(status)) { 
    this.update(status, note) 
  }

  async start(signal) {
    const writer = await this.#writer
    const reader = this.#stream

    signal.addEventListener('abort', () => reader.end(), { once: true })

    for await (const value of reader)
      await writer.echoRecord(value, ' ')
  }
}
