import fs from 'fs'
import { Writable } from 'stream'

export default class CliFdWritable extends Writable {
  constructor({ fd, autoClose = true }) {
    super()
    this.fd = fd
    this.autoClose = autoClose
    this.count = 0
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