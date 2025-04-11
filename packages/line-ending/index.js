import { Transform } from 'stream'
import os from 'os'

const LF_BYTE = 0x0A         // '\n'
const CR_BYTE = 0x0D         // '\r'
export const CRLF = '\r\n'
export const LF = '\n'
export const LINE_ENDINGS = {
  windows: CRLF,
  unix: LF
}

const DEFAULT_LINE_ENDING = os.platform() === 'win32' ? CRLF : LF

export class LineEnding extends Transform {
  #lineEnding
  #leftover
  #normalize

  constructor({ lineEnding = DEFAULT_LINE_ENDING, normalize = false, ...options } = {}) {
    super(options)
    this.#lineEnding = Buffer.from(lineEnding)
    this.#normalize = normalize
    this.#leftover = Buffer.alloc(0)
  }

  #emitLine(buffer) {
    const endsWithCR = buffer.length > 0 && buffer[buffer.length - 1] === CR_BYTE
    const line = endsWithCR ? buffer.slice(0, -1) : buffer
    this.push(line)
    this.push(this.#lineEnding)
  }

  #transformChunk(chunk) {
    let data = Buffer.concat([this.#leftover, chunk])
    let start = 0

    for (let i = 0; i < data.length; i++) {
      if (data[i] === LF_BYTE) {
        const line = data.slice(start, i)
        this.#emitLine(line)
        start = i + 1
      }
    }

    this.#leftover = data.slice(start)
  }

  #flushLeftover() {
    if (this.#normalize) {
      if (this.#leftover.length > 0) {
        this.#emitLine(this.#leftover)
      } else {
        this.push(this.#lineEnding)
      }
    } else if (this.#leftover.length > 0) {
      this.push(this.#leftover)
    }
  }

  _transform(chunk, encoding, callback) {
    this.#transformChunk(chunk)
    callback()
  }

  _flush(callback) {
    this.#flushLeftover()
    callback()
  }
}
