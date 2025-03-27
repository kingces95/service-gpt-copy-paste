import { streamWrite } from '@kingjs/stream-write'
import { CliWritable } from '@kingjs/cli-writable'

export const ENCODING_UTF8 = 'utf8'

export class CliEcho {
  static from(path) {
    return new CliEcho(CliWritable.fromPath(path))
  }

  #stream
  #signal
  #encoding
  #options

  constructor(stream) {
    this.#stream = stream
    this.#signal = null
    this.#encoding = ENCODING_UTF8
    this.#options = { 
      signal: this.#signal, 
      encoding: this.#encoding
    }
  }

  async echo(line) { 
    await this.echoRecord([line])
  }
  async echoRecord(fields, separator = ' ') {
    const stream = this.#stream
    const encoding = this.#encoding

    for (let i = 0; i < fields.length; i++) {
      if (i > 0)
        await streamWrite(stream, Buffer.from(separator, encoding), this.#options)
      await streamWrite(stream, Buffer.from(String(fields[i]), encoding), this.#options)
    }
    await streamWrite(stream, Buffer.from('\n', encoding), this.#options)
  }
}

