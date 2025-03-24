import Utf8CharReader from '@kingjs/utf8-char-reader'
import { AbortError } from '@kingjs/abort-error'
import { CliProvider } from '@kingjs/cli-provider'
import { CliReadable } from '@kingjs/cli-readable'

const NEW_LINE_BYTE = 0x0A
const DEFAULT_IFS = ' '

export class CliParser extends CliProvider {
  static parameters = {
    ifs: 'Input field separator',
  }
  static { this.initialize() }

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
        yield null
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
  #signal

  constructor(stream, parser) {
    this.#stream = stream
    this.#parser = parser
    this.#signal = null
  }
  
  async readByte() {
    const stream = this.#stream
    const signal = this.#signal

    // Attempt immediate read
    const chunk = stream.read(1)
    if (chunk) {
      return chunk[0]
    }
  
    return new Promise((resolve, reject) => {
      const onReadable = () => {
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
        reject(new AbortError())
      }
  
      const cleanup = () => {
        stream.off('readable', onReadable)
        stream.off('end', onEnd)
        stream.off('error', onError)
        signal?.removeEventListener('abort', onAbort)
      }
  
      stream.once('readable', onReadable)
      stream.on('end', onEnd)
      stream.on('error', onError)
      signal?.addEventListener('abort', onAbort)
    })
  }
  
  async readString(charCount) {
    const charReader = new Utf8CharReader()
  
    while (charReader.charCount < charCount) {
      const byte = await this.readByte()
      if (byte === null) break // Handle unexpected EOF
      charReader.processByte(byte)
    }
  
    return charReader.toString() // Convert the buffered bytes to a string
  }
  
  async readChar() {
    return await this.readString(1)
  }
  
  async read() {
    const charReader = new Utf8CharReader()
  
    while (true) {
      const byte = await this.readByte()
      if (byte === null || byte === NEW_LINE_BYTE) break // Stop at newline or EOF
      charReader.processByte(byte)
    }
  
    return charReader.toString() // Convert the buffered bytes to a string
  }

  async readArray() {
    if (!this.#parser) throw new Error('Parser not set')
    const line = await this.read()
    return this.#parser.toArray(line)
  }
  
  async readRecord(fields) {
    if (!this.#parser) throw new Error('Parser not set')
    const line = await this.read()
    return this.#parser.toRecord(line, fields)
  }
}
