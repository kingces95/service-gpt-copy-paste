import { CliServiceProvider } from '@kingjs/cli-service'
import { CliReadable, DEV_STDIN } from '@kingjs/cli-readable'
import { CliWritable, DEV_STDOUT } from '@kingjs/cli-writable'

export class CliStdStream extends CliServiceProvider {
  static { this.initialize(import.meta) }

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

export class CliStdMon extends CliStdStream { 
  static parameters = { stdmon: 'Status stream' }
  static { this.initialize(import.meta) }

  constructor({ stdmon = DEV_STDOUT, ...rest } = { }) { 
    if (CliStdMon.initializing(new.target, { stdmon })) 
      return super()
    super(rest, { path: stdmon })
  }
}