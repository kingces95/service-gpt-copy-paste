import fs from 'fs'
import { Readable } from 'stream'

export default class CliFdReadable extends Readable {
  constructor(fd, ifs = ' ') {
    super(ifs)
    this.fd = fd
    this.offset = 0 // Tracks file offset for async reads
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
    fs.read(this.fd, buffer$, 0, buffer$.length, this.offset, (err, bytesRead, buffer) => {
      this.reading = false
      if (err) {
        this.destroy(err)
        return
      }

      if (bytesRead > 0) {
        this.offset += bytesRead
        const slice = buffer.slice(0, bytesRead)
        this.push(slice) // Push only the bytes read
      } else {
        this.push(null) // Signal end of stream
      }
    })
  }
}