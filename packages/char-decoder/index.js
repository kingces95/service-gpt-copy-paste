import assert from 'assert'

const ENCODING_UTF8 = 'utf8'

// Helper for UTF-8 byte analysis
const Utf8 = {
  bytesRemaining(byte) {
    if ((byte & 0b10000000) === 0) return 0
    if ((byte & 0b11100000) === 0b11000000) return 1
    if ((byte & 0b11110000) === 0b11100000) return 2
    if ((byte & 0b11111000) === 0b11110000) return 3
    throw new Error('Invalid UTF-8 start byte')
  },
  isSingleByte(byte) {
    return (byte & 0b10000000) === 0
  },
  isStartByte(byte) {
    return (byte & 0b11000000) !== 0b10000000
  }
}

// CharDecoder class for decoding UTF-8 characters from a byte stream
// and managing the state of multi-byte characters. 
//
// CharDecoder maintains a view of a string over a buffer of bytes.
// 
// A producer pushes bytes into the decoder. This operation does not affect
// the view the consumer has of the the string.
//
// A consumer initiates the decoding process by creating an iterator.
// Each call to `next()` will decode one character and increment
// `length` by one or report done if no more characters can be decoded. 
//
// A consumer can pause iterating at any time and peek at the last byte. 
// 
// A consumer pop the last byte, but only if the last byte is a single-byte 
// character (e.g. new line or carrage return). This can be repeated so long 
// as there are trailing single-byte characters. Popping a byte prevents 
// further iteration.
//
// A consumer can call `toString()` at any time to decode the string upto
// the last byte decoded less any single-byte characters that were popped. 
// 
// Calling `clear()` concludes the decoding process and indicates the bytes
// comprising the string and any that were popped have been consumed.
//
// If the consumer times out before consuming a string, the consumer can 
// create a new iterator to begin the decoding process again.
export class CharDecoder {
  #bytes = []

  // number of bytes remaining to complete a multi-byte character
  // 0 <= #multiBytesRemaining <= 3
  #multiBytesRemaining = 0
  
  // character length of the current trimmed string
  #length = 0

  constructor(encoding = ENCODING_UTF8) {
    this.clear()
  }

  #throwIfBytesRemaining() {
    if (this.#multiBytesRemaining !== 0) 
      throw new Error('UTF-8 character incomplete.')
  }
  
  get buffer() {
    return Buffer.from(this.#bytes)
  }

  get length() {
    return this.#length
  }
  
  get canStringify() { 
    return this.#multiBytesRemaining == 0 
  }

  get isEmpty() {
    return this.#bytes.length === 0
  }

  push(byte) {
    this.#bytes.push(byte)
    this.#multiBytesRemaining = !this.#multiBytesRemaining
      ? Utf8.bytesRemaining(byte)
      : this.#multiBytesRemaining - 1
    this.#length += !this.#multiBytesRemaining ? 1 : 0
  }

  peek() {
    if (this.isEmpty) return null
    return this.#bytes.at(-1)
  }

  pop() {
    this.#throwIfBytesRemaining()
    if (this.isEmpty) 
      throw new Error('No bytes to pop.')
    else if (!Utf8.isSingleByte(this.peek()))
      throw new Error('Cannot pop a multi-byte character as a byte.')
    return this.#bytes.pop()
  }

  clear() {
    this.#throwIfBytesRemaining()
    this.#bytes = []
    this.#length = 0
    this.#multiBytesRemaining = 0
  }
  
  toString() {
    this.#throwIfBytesRemaining()
    return this.buffer.toString('utf8')
  }
}