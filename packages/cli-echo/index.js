import { CliGroup } from '@kingjs/cli-group'
import { CliOut } from '@kingjs/cli-command'
import { write, writeRecord } from '@kingjs/cli-write'

export class CliEcho extends CliGroup {
  static services = [ CliOut ]

  #stream
  #signal

  constructor(options) {
    if (CliEcho.initializing(new.target))
      return super()

    super(options)

    this.#stream = this.getService(CliOut)
    this.#signal = null
  }

  async write(line) { 
    return write(this.#stream, this.#signal, line) 
  }
  async writeRecord(fields, ifs = ' ') { 
    return writeRecord(this.#stream, this.#signal, ifs[0], fields) 
  }
}

