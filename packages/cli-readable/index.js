import { Readable } from 'stream';
import fs from 'fs';
import Utf8CharReader from '@kingjs/utf8-char-reader';

const NEW_LINE_BYTE = 0x0A;

export default class CliFdReadable extends Readable {
  constructor(fd) {
    super();
    this.fd = fd;
    this.buffer = Buffer.alloc(1); // Initial single-byte buffer
    this.offset = 0; // Tracks file offset for async reads
    this.reading = false; // Indicates if an async read is in progress
  }

  _read(size) {
    if (this.reading) return; // Prevent multiple concurrent reads
    this.reading = true;

    // Initiate the asynchronous read operation
    fs.read(this.fd, this.buffer, 0, this.buffer.length, this.offset, (err, bytesRead, buffer) => {
      this.reading = false;
      if (err) {
        this.destroy(err);
        return;
      }

      if (bytesRead > 0) {
        this.offset += bytesRead;
        this.push(buffer.slice(0, bytesRead)); // Push only the bytes read
      } else {
        this.push(null); // Signal end of stream
      }
    });
  }

  read(size) {
    if (size > 1 && this.buffer.length === 1) {
      // Expand the buffer size if client requests more than 1 byte
      this.buffer = Buffer.alloc(1024); // Set a conventional buffer size
    }

    return super.read(size);
  }

  async readByte$() {
    const chunk = this.read(1);
    if (chunk) {
      return chunk[0];
    }

    return new Promise((resolve) => {
      this.once('readable', () => {
        const nextChunk = this.read(1);
        resolve(nextChunk ? nextChunk[0] : null);
      });
    });
  }

  async readString(charCount) {
    const charReader = new Utf8CharReader();

    while (charReader.charCount < charCount) {
      const byte = await this.readByte$();
      if (byte === null) break; // Handle unexpected EOF
      charReader.processByte(byte);
    }

    return charReader.toString(); // Convert the buffered bytes to a string
  }

  async readLine$() {
    const charReader = new Utf8CharReader();

    while (true) {
      const byte = await this.readByte$();
      if (byte === null || byte === NEW_LINE_BYTE) break; // Stop at newline or EOF
      charReader.processByte(byte);
    }

    return charReader.toString(); // Convert the buffered bytes to a string
  }

  static *split$(line, count, delimiter = '\\s+') {
    const regex = new RegExp(`([^${delimiter}]+)[${delimiter}]*`, 'g');
    let lastIndex = 0;

    for (let i = 0; i < count - 1; i++) {
      const match = regex.exec(line);
      if (match) {
        yield match[1];
        lastIndex = regex.lastIndex;
      } else {
        yield null;
        return;
      }
    }

    // Yield the rest of the line as the last field
    yield line.slice(lastIndex);
  }

  async readArray(delimiter = ' ') {
    const line = await this.readLine$();
    const iterator = CliFdReadable.split$(line, Infinity, delimiter);
    return Array.from(iterator);
  }

  async readRecord(fields, delimiter = ' ') {
    const line = await this.readLine$();
    const iterator = CliFdReadable.split$(line, fields.length, delimiter);

    const record = {};
    let index = 0;

    for (const value of iterator) {
      record[fields[index]] = value;
      index++;
    }

    return record;
  }
}
