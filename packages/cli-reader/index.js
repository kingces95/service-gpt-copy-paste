import { CliParser } from '@kingjs/cli-parser'
import { CliFieldType } from '@kingjs/cli-field-type'
import { PreambleScanner } from '@kingjs/cursor-container-unicode'
import { LazyPromise } from '@kingjs/lazy-promise'
import { toArray } from './to-array.js'
import { CliSipper } from './cli-sipper.js'
import {
  Utf8Signature,
  Utf16ByteOrderMarks,
} from '@kingjs/unicode'

const DEFAULT_ENCODING = 'utf-8'
const PREAMBLES = {
  'utf-8': Utf8Signature.signature,
  'utf-16be': Utf16ByteOrderMarks.big,
  'utf-16le': Utf16ByteOrderMarks.little,
}

export class CliReader {
  #stream
  #sipper

  constructor(stream) {
    this.#stream = stream
    const chunkIterator = stream[Symbol.asyncIterator]()
    this.#sipper = new LazyPromise(async () => {
      const scanner = new PreambleScanner({
        sequences: PREAMBLES,
        defaultMetadata: DEFAULT_ENCODING,
      })
  
      while (true) {
        const { done, value } = await chunkIterator.next()
        if (done) return new CliSipper(chunkIterator, DEFAULT_ENCODING)

        const result = scanner.pushBytes(value)
        if (!result) continue

        return new CliSipper(chunkIterator, result.key, result.data)
      }
    })
  }

  async *#generate(parser) {
    while (true) {
      const line = await this.readLine()
      if (line === null) break
      yield parser.parse(line)
    }
  }

  async read() { 
    return (await this.#sipper).read()
  }

  async readString(charCount = Infinity) {
    if (!charCount)
      throw new TypeError('charCount must be a positive integer.')

    return (await this.#sipper).sipString(charCount)
  }

  async readLine({
    keepNewLines = false,
    keepCarriageReturns = false
  } = {}) {  
    return (await this.#sipper).sipLine({
      keepNewLines,
      keepCarriageReturns
    })
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
    return toArray(this.lines(options))
  }
  async readLists() {
    return toArray(this.lists())
  }
  async readComments() {
    return toArray(this.comments())
  }
  async readTuples(metadata = 0) {
    return toArray(this.tuples(metadata))
  }
  async readRecords(metadata = {}) {
    return toArray(this.records(metadata))
  }

  async dispose() {
    this.#stream.destroy?.()
  }
}
