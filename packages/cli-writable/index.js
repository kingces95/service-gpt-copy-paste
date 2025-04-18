import fs from 'fs'
import { Writable } from 'stream'

export const STDOUT_FD = 1
export const STDERR_FD = 2

export const DEV_STDOUT = '/dev/stdout'
export const DEV_FD_1 = '/dev/fd/1'
export const DEV_STDERR = '/dev/stderr'
export const DEV_FD_2 = '/dev/fd/2'
export const DEV_NULL = '/dev/null'

export class CliWritable extends Writable {
  
  static async fromPath(path) {
    // switch on known /dev writable paths
    switch (path) {
      case DEV_STDOUT:
      case DEV_FD_1:
        return new CliFdWritable({ fd: STDOUT_FD })
      case DEV_STDERR:
      case DEV_FD_2:
        return new CliFdWritable({ fd: STDERR_FD })
      case DEV_NULL:
        return new CliNullWritable()
      default:
        // regex to match /dev/fd/N
        const match = path.match(/^\/dev\/fd\/(\d+)$/)
        if (match) {
          const fd = Number(match[1])
          return new CliFdWritable({ fd })
        }

        // open the file
        const fileHandle = await fs.promises.open(path, 'w')
        return new CliFileWriter({ fileHandle })
    }
  }

  constructor(options) {
    super(options)
    this.count = 0
  }
}

class CliNullWritable extends CliWritable {
  _write(chunk, encoding, callback) {
    this.count += chunk.length
    callback()
  }
}

class CliFdWritable extends CliWritable {
  constructor({ fd, autoClose = true }) {
    super()
    this.fd = fd
    this.autoClose = autoClose
  }

  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding) // Ensure chunk is a buffer
    fs.write(this.fd, buffer, 0, buffer.length, null, () => {
      this.count += buffer.length
      callback()
    }) // Include encoding when converting to buffer
  }

  _final(callback) {
    if (!this.autoClose)
      return

    fs.close(this.fd, (err) => {
      callback(err) // Propagate errors or complete the final operation
    })
  }
}

class CliFileWriter extends CliFdWritable {
  #fileHandle // prevent garbage collection

  constructor({ fileHandle, autoClose = true }) {
    super({ fd: fileHandle.fd, autoClose })
    this.#fileHandle = fileHandle
  }
}
