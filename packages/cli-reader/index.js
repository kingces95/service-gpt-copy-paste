import { sip } from '@kingjs/stream-sip'
import { CliParser } from '@kingjs/cli-parser'
import { CliProcess } from '@kingjs/cli-process'
import { CliRecordInfoLoader } from '@kingjs/cli-record-info'

const LINE_FEED_BYTE = 0x0A
const CARRAGE_RETURN_BYTE = 0x0D

export class CliReader {
  #iterator

  constructor(stream) {
    const signal = CliProcess.signal
    this.#iterator = sip(stream, { signal })
  }

  async readString(charCount = Infinity) {
    while (true) {
      const { done, value: { buffer, eof } = { } } = await this.#iterator.next()
      if (done || (eof && !buffer.length)) return null

      if (eof || buffer.length == charCount) {
        const result = buffer.toString()
        buffer.clear()
        return result
      }
    }
  }
  
  async readLine({
    keepNewLines = false,
    keepCarriageReturns = false
  } = {}) {  
    const stripNewLines = !keepNewLines
    const stripCarriageReturns = !keepCarriageReturns

    while (true) {
      const { done, value: { buffer, eof } = { } } = await this.#iterator.next()
      if (done || (eof && !buffer.length)) return null

      if (buffer.peek() != LINE_FEED_BYTE && !eof)
        continue

      if (stripNewLines) {
        if (buffer.peek() === LINE_FEED_BYTE)
          buffer.pop() // remove the new line byte

        if (stripCarriageReturns && buffer.peek() === CARRAGE_RETURN_BYTE)
          buffer.pop() // remove the carriage return byte
      }

      const result = buffer.toString()
      buffer.clear()
      return result
    }
  }

  async readChar() {
    return await this.readString(1)
  }

  // async iterator that yields lines
  async *[Symbol.asyncIterator](options = { 
    count: Infinity,
    keepNewLines: false,
    keepCarriageReturns: false
  }) {
    let count = options.count ?? Infinity

    while (count-- > 0) {
      const line = await this.readLine(options)
      if (line === null) break
      yield line
    }
  }

  async mapLines(callback, options = { 
    count: Infinity,
    keepNewLines: false,
    keepCarriageReturns: false,
  }) {
    for await (const line of this[Symbol.asyncIterator](options)) {
      if (line === null) break
      callback(line)
    }
  }

  async readLines(options = { 
    count: Infinity,
    keepNewLines: false,
    keepCarriageReturns: false,
  }) {
    const lines = []
    await this.mapLines(line => {
      if (line === null) return
      lines.push(line)
    }, options)
    return lines
  }

  async readText() {
    for await (const text of this.generateText())
      return text
    return null
  }

  async readFields(typesOrCount) {
    for await (const fields of this.generateFields(typesOrCount))
      return fields
    return null
  }
  
  async readRecord(fields) {
    for await (const record of this.generateRecords(fields))
      return record
    return null
  }

  async *generateText() {
    while (true) {
      const line = await this.readLine()
      if (line === null) break
      yield CliParser.parse(line)
    }
  }

  async *generateFields(typesOrCount = Infinity) {
    const type = CliRecordInfoLoader.load(typesOrCount)
    if (!type.isArray)
      throw new Error('Fields must be array of types or count.')

    while (true) {
      const line = await this.readLine()
      if (line === null) break
      yield CliParser.parse(line, typesOrCount)
    }
  }

  async *generateRecords(fields = {}) {
    const type = CliRecordInfoLoader.load(fields)
    if (!type.isObject)
      throw new Error('Fields must be a pojo.')

    while (true) {
      const line = await this.readLine()
      if (line === null) break
      yield CliParser.parse(line, type)
    }
  }
}
