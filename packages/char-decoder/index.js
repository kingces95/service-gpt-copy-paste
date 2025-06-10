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

export class CharDecoder {
  #bytes = []
  #length = 0
  #bytesRemaining = 0

  constructor(encoding) {
    if (encoding && encoding.toLowerCase() !== ENCODING_UTF8)
      throw new Error(`Unsupported encoding: ${encoding}`)
    this.clear()
  }

  #throwIfBytesRemaining() {
    if (this.#bytesRemaining !== 0) 
      throw new Error('UTF-8 character incomplete.')
  }
  
  get buffer() {
    return Buffer.from(this.#bytes)
  }

  get length() {
    return this.#length
  }
  
  get canStringify() { 
    return this.#bytesRemaining == 0 
  }

  get isEmpty() {
    return this.#bytes.length === 0
  }

  push(byte) {
    this.#bytes.push(byte)
    this.#bytesRemaining = !this.#bytesRemaining
      ? Utf8.bytesRemaining(byte)
      : this.#bytesRemaining - 1
    this.#length += !this.#bytesRemaining ? 1 : 0
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
    this.#bytesRemaining = 0
  }

  toString() {
    this.#throwIfBytesRemaining()
    return this.buffer.toString('utf8')
  }
}