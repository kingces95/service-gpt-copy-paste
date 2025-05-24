import { sip } from '@kingjs/stream-sip'
import { CliParser } from '@kingjs/cli-parser'
import { CliProcess } from '@kingjs/cli-process'

const NEW_LINE_BYTE = 0x0A
const CARRAGE_RETURN_BYTE = 0x0D

export class CliReader {
  #stream

  constructor(stream) {
    this.#stream = stream
  }

  async readString(charCount) {
    if (!charCount) return ''

    let buffer = null
    const signal = CliProcess.signal
    for await (buffer of sip(this.#stream, { signal }))
      if (buffer.length == charCount) break
    
    return buffer.toString()
  }
  
  async readChar() {
    return await this.readString(1)
  }
  
  async read() {  
    let buffer = null
    const signal = CliProcess.signal
    for await (buffer of sip(this.#stream, { signal })) {
      // if new line then break
      if (buffer.peek() === NEW_LINE_BYTE) {
        buffer.pop() // remove the new line byte
        if (buffer.peek() === CARRAGE_RETURN_BYTE)
          buffer.pop() // remove the carriage return byte
        break
      }
    }
    return buffer.toString()
  }

  async readArray(count) {
    const line = await this.read()
    return CliParser.toArray(line, count)
  }
  
  async readRecord(fields) {
    const line = await this.read()
    return CliParser.toRecord(line, fields)
  }

  // async iterator that yields lines
  async *[Symbol.asyncIterator]() {
    while (true) {
      const line = await this.read()
      if (line === null) break
      yield line
    }
  }
}
