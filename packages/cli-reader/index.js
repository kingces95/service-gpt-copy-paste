import Utf8CharReader from '@kingjs/utf8-char-reader'
import { CliService } from '@kingjs/cli-service'
import { AbortError } from '@kingjs/abort-error'
import { macrotick } from '@kingjs/macrotick'
import { CliReadable } from '@kingjs/cli-readable'

const NEW_LINE_BYTE = 0x0A
const CARRAGE_RETURN_BYTE = 0x0D
const DEFAULT_IFS = ' '

export class CliParser extends CliService {
  static parameters = {
    ifs: 'Input field separator',
  }
  static { this.initialize(import.meta) }

  #ifs

  constructor({ ifs = DEFAULT_IFS, ...rest } = { }) {
    if (CliParser.initializing(new.target, { ifs }))
      return super()
    super(rest)

    this.#ifs = ifs
  }

  *#split(line, count) {
    const ifs = this.#ifs
    const regex = new RegExp(`([^${ifs}]+)[${ifs}]*`, 'g')
    let lastIndex = 0
  
    for (let i = 0; i < count - 1; i++) {
      const match = regex.exec(line)
      if (match) {
        yield match[1]
        lastIndex = regex.lastIndex
      } else {
        return
      }
    }
  
    // Yield the rest of the line as the last field
    yield line.slice(lastIndex)
  }

  async toArray(line) {
    const iterator = this.#split(line, Infinity)
    return Array.from(iterator)
  }
  
  async toRecord(line, fields) {
    let record = { }
  
    if (Array.isArray(fields)) {
      const iterator = this.#split(line, fields.length)
      fields.forEach((field, index) => {
        record[field] = iterator.next().value
      })
    } else if (typeof fields === 'object') {
      const fieldNames = Object.keys(fields)
      const iterator = this.#split(line, fieldNames.length)
  
      fieldNames.forEach((field, index) => {
        const value = iterator.next().value
        if (value === undefined || value === null) 
          return
  
        var type = fields[field]
        if (type == '#') type = 'number'
        if (type == '!') type = 'boolean'
  
        if (type === 'number') {
          record[field] = Number(value)
  
        } else if (type === 'boolean') {
          record[field] = !(
            value === '' 
            || value === 'false' 
            || value === 'False' 
            || value === '0')
        } else {
          record[field] = value
        }
      })
    }
  
    return record
  }
}

export class CliReader {
  static fromPath(path, parser) {
    return new CliReader(CliReadable.fromPath(path), parser)
  }
  static from(streamStringOrGenerator, parser) {
    return new CliReader(CliReadable.from(streamStringOrGenerator), parser)
  }

  #stream
  #parser

  constructor(stream, parser) {
    this.#stream = stream
    this.#parser = parser
  }

  from(streamStringOrGenerator) { 
    return CliReader.from(streamStringOrGenerator, this.#parser)
  }
  fromPath(path) { 
    return CliReader.fromPath(path, this.#parser)
  }
  
  async readByte(signal) {
    const stream = this.#stream

    // Attempt immediate read
    const chunk = stream.read(1)
    if (chunk) {
      return chunk[0]
    }
  
    return new Promise((resolve, reject) => {
      const onReadable = (...args) => {
        try {
          const chunk = stream.read(1)
          if (!chunk) {
            stream.once('readable', onReadable)
            return 
          }
          cleanup()
          resolve(chunk[0])
        } catch(err) {
          try { cleanup() } 
          catch(err) { reject(err) }
          reject(err)
        }
      }
  
      const onEnd = () => {
        cleanup()
        resolve(null)
      }
  
      const onError = (err) => {
        cleanup()
        reject(err)
      }
  
      const onAbort = () => {
        cleanup()
        reject(new AbortError('CliReader'))
      }
  
      const cleanup = () => {
        stream.off('readable', onReadable)
        stream.off('end', onEnd)
        stream.off('error', onError)
        signal?.removeEventListener('abort', onAbort)
      }
  
      signal?.addEventListener('abort', onAbort)
      stream.on('error', onError)
      stream.on('end', onEnd)
      stream.once('readable', onReadable)
    })
  }
  
  async readString(charCount, signal) {
    const charReader = new Utf8CharReader()
  
    while (charReader.charCount < charCount) {
      const byte = await this.readByte(signal)
      if (byte === null) break // Handle unexpected EOF
      charReader.processByte(byte)
    }
  
    return charReader.toString() // Convert the buffered bytes to a string
  }
  
  async readChar(signal) {
    return await this.readString(1, signal)
  }
  
  async read(signal) {  
    const charReader = new Utf8CharReader()
  
    while (true) {
      const byte = await this.readByte(signal)
      
      // gives tty a chance to send ctrl-c
      if (byte === null) 
        await macrotick(signal) 

      if (byte === null || byte === NEW_LINE_BYTE) 
        break

      if (byte === CARRAGE_RETURN_BYTE)
        continue

      charReader.processByte(byte)
    }
  
    return charReader.toString()
  }

  async readArray(signal) {
    if (!this.#parser) throw new Error('Parser not set')
    const line = await this.read(signal)
    return !line ? null : this.#parser.toArray(line)
  }
  
  async readRecord(fields, signal) {
    if (!this.#parser) throw new Error('Parser not set')
    const line = await this.read(signal)
    return this.#parser.toRecord(line, fields)
  }
}
