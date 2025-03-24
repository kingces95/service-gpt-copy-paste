import fs from 'fs'
import { Readable } from 'stream'
import assert from 'assert'

const STDIN_FD = 0

export const DEV_STDIN = '/dev/stdin'
export const DEV_FD_0 = '/dev/fd/0'
export const DEV_NULL = '/dev/null'

export class CliReadable extends Readable {

  static from(value) {
    if (value instanceof CliReadable)
      return value
    
    if (typeof value === 'string' || Buffer.isBuffer(value))
      return new CliStringReadable(value)

    const gen = typeof value === 'function' ? value() : value

    if (typeof gen[Symbol.asyncIterator] === 'function')
      return new CliAsyncGeneratorReadable(gen)

    if (typeof gen[Symbol.iterator] === 'function')
      return new CliGeneratorReadable(gen)

    throw new TypeError('Unsupported input type for CliReadable')
  }
  
  static async fromPath(path) {
    // Switch on known /dev readable paths
    switch (path) {
      case DEV_STDIN:
      case DEV_FD_0:
        return new CliFdReadable({ fd: STDIN_FD })
      case DEV_NULL:
        return new CliNullReadable()
      default:
        // Regex to match /dev/fd/N
        const match = path.match(/^\/dev\/fd\/(\d+)$/)
        if (match) {
          const fd = Number(match[1])
          return new CliFdReadable({ fd })
        }

        // Open the file
        const fileHandle = await fs.promises.open(path, 'r')
        return new CliFileHandleReader({ fileHandle })
    }
  }

  constructor(options) {
    super(options)
    this.count = 0
  }
}

class CliAsyncGeneratorReadable extends CliReadable {
  constructor(generator) {
    super()
    this.iterator = typeof generator === 'function' ? generator() : generator
    this.buffer = Buffer.alloc(0)
    this.ended = false
    this.reading = false
  }

  async _refill(size) {
    while (this.buffer.length < size && !this.ended) {
      const { value, done } = await this.iterator.next()
      if (done) {
        this.ended = true
        break
      }

      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
      this.buffer = Buffer.concat([this.buffer, chunk])
    }
  }

  _read(size) {
    if (this.reading) return
    this.reading = true

    this._refill(size).then(() => {
      const toSend = this.buffer.slice(0, size)
      this.buffer = this.buffer.slice(size)

      this.count += toSend.length
      this.reading = false
      this.push(toSend.length > 0 ? toSend : (this.ended ? null : ''))
    }).catch(err => this.destroy(err))
  }
}

class CliGeneratorReadable extends CliReadable {
  constructor(generator) {
    super()
    this.iterator = typeof generator === 'function' ? generator() : generator
    this.buffer = Buffer.alloc(0)
    this.ended = false
  }

  _read(size) {
    while (this.buffer.length < size && !this.ended) {
      const { value, done } = this.iterator.next()
      if (done) {
        this.ended = true
        break
      }

      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
      this.buffer = Buffer.concat([this.buffer, chunk])
    }

    const toSend = this.buffer.slice(0, size)
    this.buffer = this.buffer.slice(size)

    this.count += toSend.length
    this.push(toSend.length > 0 ? toSend : (this.ended ? null : ''))
  }
}

class CliStringReadable extends CliReadable {
  constructor(str) {
    super()
    this.buffer = Buffer.from(str)
  }

  _read(size) {
    const remaining = this.buffer.length - this.count
    const toSend = Math.min(size, remaining)

    if (toSend <= 0) {
      this.push(null)
      return
    }

    const chunk = this.buffer.slice(this.count, this.count + toSend)
    this.push(chunk)
    this.count += toSend
  }
}

class CliNullReadable extends CliReadable {
  _read(size) {
    this.push(null)
  }
}

class CliFdReadable extends CliReadable {
  constructor({ fd }) {
    super()
    this.fd = fd
    this.reading = false // Indicates if an async read is in progress
    this.exact = true
  }

  read(size) {
    if (size > 1) {
      this.exact = false;
    }
    return super.read(size);
  }

  _read(size) {
    if (this.reading) 
      return // Prevent multiple concurrent reads
    this.reading = true

    if (this.exact) 
      size = 1

    // Expand the buffer size if client requests more than 1 byte
    const buffer$ = Buffer.alloc(size) // Set a conventional buffer size

    // Initiate the asynchronous read operation
    fs.read(this.fd, buffer$, 0, buffer$.length, null, (err, bytesRead, buffer) => {
      this.reading = false
      if (err) {
        this.destroy(err)
        return
      }

      if (bytesRead > 0) {
        this.count += bytesRead
        const slice = buffer.slice(0, bytesRead)
        assert(this.push(slice)) // Push only the bytes read
      } else {
        this.push(null) // Signal end of stream
      }
    })
  }
}

class CliFileHandleReader extends CliFdReadable {
  #fileHandle // Prevent garbage collection

  constructor({ fileHandle, autoClose = true }) {
    super({ fd: fileHandle.fd, autoClose })
    this.#fileHandle = fileHandle
  }
}