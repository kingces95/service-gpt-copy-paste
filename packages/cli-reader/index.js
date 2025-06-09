import { sip } from '@kingjs/stream-sip'
import { CliParser } from '@kingjs/cli-parser'
import { CliFieldType } from '@kingjs/cli-field-type'

const LINE_FEED_BYTE = 0x0A
const CARRAGE_RETURN_BYTE = 0x0D

export class CliReader {
  #generator

  constructor(stream) {
    this.#generator = sip(stream)
  }

  async *#generate(parser) {
    while (true) {
      const line = await this.readLine()
      if (line === null) break
      yield parser.parse(line)
    }
  }
  async #spread(iterator) {
    const result = []
    for await (const item of iterator)
      result.push(item)
    return result
  }

  async readString(charCount = Infinity) {
    while (true) {
      const { done, value: { decoder, eof } = { } } = await this.#generator.next()
      if (done || (eof && !decoder.length)) return null

      if (eof || decoder.length == charCount) {
        const result = decoder.toString()
        decoder.clear()
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
      const { done, value: { decoder, eof } = { } } = await this.#generator.next()
      if (done || (eof && !decoder.length)) return null

      if (decoder.peek() != LINE_FEED_BYTE && !eof)
        continue

      if (stripNewLines) {
        if (decoder.peek() === LINE_FEED_BYTE)
          decoder.pop() // remove the new line byte

        if (stripCarriageReturns && decoder.peek() === CARRAGE_RETURN_BYTE)
          decoder.pop() // remove the carriage return byte
      }

      const result = decoder.toString()
      decoder.clear()
      return result
    }
  }
  async readChar() {
    return await this.readString(1)
  }
  async readList() {
    for await (const array of this.lists())
      return array
    return null
  }
  async readComment() {
    for await (const text of this.comments())
      return text
    return null
  }
  async readTuple(metadata) {
    for await (const tuple of this.tuples(metadata))
      return tuple
    return null
  }
  async readRecord(metadata) {
    for await (const record of this.records(metadata))
      return record
    return null
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
  async *lines(options = { 
    count: Infinity,
    keepNewLines: false,
    keepCarriageReturns: false,
  }) {
    yield* this[Symbol.asyncIterator](options)
  }
  async *chars(charCount = Infinity) {
    while (charCount-- > 0) {
      const char = await this.readChar()
      if (char === null) break
      yield char
    }
  }
  async *lists() {
    yield* this.#generate(CliParser.create(Infinity))
  }
  async *comments() {
    yield* this.#generate(CliParser.create())
  }
  async *tuples(metadata = 0) {
    const parser = CliParser.create(metadata)
    const { info } = parser
    if (!info.isArray || info.isList)
      throw new Error('Metadata must be array of types or a count.')

    yield* this.#generate(parser)
  }
  async *records(metadata = {}) {
    if (Array.isArray(metadata)) {
      if (metadata.find(name => typeof name != 'string') != null)
        throw new TypeError('Metadata must be an array of strings.')
      metadata = Object.fromEntries(
        metadata.map(name => [name, CliFieldType.word]))
    }

    const parser = CliParser.create(metadata)
    const { info } = parser
    if (!info.isObject)
      throw new Error('Metadata must be a POJO or an array of strings.')

    yield* this.#generate(parser)
  }

  async readLines(options) {
    return this.#spread(this.lines(options))
  }
  async readChars(charCount = Infinity) {
    throw new Error('Not implemented yet.')
  }
  async readLists() {
    return this.#spread(this.lists())
  }
  async readComments() {
    return this.#spread(this.comments())
  }
  async readTuples(metadata = 0) {
    return this.#spread(this.tuples(metadata))
  }
  async readRecords(metadata = {}) {
    return this.#spread(this.records(metadata))
  }

  async dispose() {
    await this.#generator.dispose()
  }
}
