import fs from 'fs'
import { Writable } from 'stream'

export default class CliFdWritable extends Writable {
  constructor(fd) {
    super()
    this.fd = fd
  }

  _write(chunk, encoding, callback) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding) // Ensure chunk is a buffer
    fs.write(this.fd, buffer, 0, buffer.length, null, callback) // Include encoding when converting to buffer
  }

  _final(callback) {
    fs.close(this.fd, (err) => {
      callback(err) // Propagate errors or complete the final operation
    })
  }
}