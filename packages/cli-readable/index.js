import fs from 'fs'
import { Readable } from 'stream'

export const STDIN_FD = 0

export const DEV_STDIN = '/dev/stdin'
export const DEV_FD_0 = '/dev/fd/0'
export const DEV_NULL = '/dev/null'

export class CliReadable extends Readable {

  static from(value) {
    if (value instanceof CliReadable)
      return value
    
    if (typeof value === 'string' || Buffer.isBuffer(value))
      return new CliStringReadable(value)

    const generator = typeof value === 'function' ? value() : value

    if (typeof generator[Symbol.asyncIterator] === 'function')
      return new CliAsyncGeneratorReadable(generator)

    if (typeof generator[Symbol.iterator] === 'function')
      return new CliGeneratorReadable(generator)

    throw new TypeError('Unsupported input type for CliReadable')
  }
  
  static async fromPath(path) {
    // Switch on known /dev readable paths
    switch (path) {
      case DEV_STDIN:
      case DEV_FD_0:
        return new CliFdReadable(STDIN_FD)
      case DEV_NULL:
        return new CliNullReadable()
      default:
        // Regex to match /dev/fd/N
        const match = path.match(/^\/dev\/fd\/(\d+)$/)
        if (match) {
          const fd = Number(match[1])
          return new CliFdReadable(fd)
        }

        // Open the file
        const fileHandle = await fs.promises.open(path, 'r')
        return new CliFileHandleReader(fileHandle)
    }
  }

  constructor(options) {
    super(options)
    this.count = 0
  }
}

class CliAsyncGeneratorReadable extends CliReadable {
  #iterator
  #buffer = Buffer.alloc(0)
  #ended = false
  #reading = false

  constructor(generator) {
    super()
    this.#iterator = typeof generator === 'function' ? generator() : generator
  }

  async #refill(size) {
    while (this.#buffer.length < size && !this.#ended) {
      const { value, done } = await this.#iterator.next()
      if (done) {
        this.#ended = true
        break
      }

      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
      this.#buffer = Buffer.concat([this.#buffer, chunk])
    }
  }

  _read(size) {
    if (this.#reading) return
    this.#reading = true

    this.#refill(size).then(() => {
      const toSend = this.#buffer.slice(0, size)
      this.#buffer = this.#buffer.slice(size)

      this.count += toSend.length
      this.#reading = false
      this.push(toSend.length > 0 ? toSend : (this.#ended ? null : ''))
    }).catch(err => this.destroy(err))
  }
}

class CliGeneratorReadable extends CliReadable {
  #iterator
  #buffer = Buffer.alloc(0)
  #ended = false

  constructor(generator) {
    super()
    this.#iterator = typeof generator === 'function' ? generator() : generator
  }

  _read(size) {
    while (this.#buffer.length < size && !this.#ended) {
      const { value, done } = this.#iterator.next()
      if (done) {
        this.#ended = true
        break
      }

      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
      this.#buffer = Buffer.concat([this.#buffer, chunk])
    }

    const toSend = this.#buffer.slice(0, size)
    this.#buffer = this.#buffer.slice(size)

    this.count += toSend.length
    this.push(toSend.length > 0 ? toSend : (this.#ended ? null : ''))
  }
}

class CliStringReadable extends CliReadable {
  #buffer

  constructor(string) {
    super()
    this.#buffer = Buffer.from(string)
  }

  _read(size) {
    const remaining = this.#buffer.length - this.count
    const toSend = Math.min(size, remaining)

    if (toSend <= 0) {
      this.push(null)
      return
    }

    const chunk = this.#buffer.slice(this.count, this.count + toSend)
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
  #fd
  #exact = true
  #defered = false

  constructor(fd) {
    super()
    this.#fd = fd
  }

  read(size) {
    if (size > 1) this.#exact = false

    if (this.#defered) {
      this.#defered = false
      this.#read(size)
    } 

    return super.read(size)
  }

  _read(size) {
    if (this.#exact && this.readableLength) {
      this.#defered = true
      return
    }

    this.#read(size)
  }

  #read(size) {
    const buffer$ = Buffer.alloc(this.#exact ? 1 : size)

    fs.read(this.#fd, buffer$, 0, buffer$.length, null, (err, bytesRead, buffer) => {
      if (err) return this.destroy(err)
      if (bytesRead > 0) {
        this.count += bytesRead
        this.push(buffer.slice(0, bytesRead))
      } else {
        this.push(null)
      }
    })
  }
}

class CliFileHandleReader extends CliFdReadable {
  #fileHandle

  constructor(fileHandle, { autoClose = true } = { }) {
    super(fileHandle.fd, { autoClose })
    this.#fileHandle = fileHandle
  }
}
