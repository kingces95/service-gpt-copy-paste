import { AbortError } from "@kingjs/abort-error"

// Wrapper around a Buffer to track consumption
export class Utf8CharBuffer {
  #bytes = []
  #length = 0
  #bytesRemaining = 0

  #throwIfBytesRemaining() {
    if (this.#bytesRemaining !== 0) 
      throw new Error('UTF-8 character incomplete')
  }

  push$(byte) {
    this.#bytes.push(byte)

    if (this.#bytesRemaining === 0) {
      this.#bytesRemaining = Utf8.bytesRemaining(byte)
    } else {
      this.#bytesRemaining--
    }

    if (this.#bytesRemaining === 0) {
      this.#length++
    }
  }

  peek() {
    this.#throwIfBytesRemaining()

    if (this.#length === 0) 
      return null

    const byte = this.#bytes.at(-1)
    if (!Utf8.isSingleByte(byte)) 
      return null

    return byte
  }

  pop() {
    this.#throwIfBytesRemaining()

    if (this.#length === 0) 
      throw new Error('Buffer is empty')

    this.#length--
    return this.#bytes.pop()
  }

  get length() {
    this.#throwIfBytesRemaining()
    return this.#length
  }
  
  get canStringify() { 
    return this.#bytesRemaining == 0 
  }

  clear() {
    this.#bytes = []
    this.#length = 0
    this.#bytesRemaining = 0
  }

  toString() {
    this.#throwIfBytesRemaining()
    return Buffer.from(this.#bytes).toString('utf8')
  }
}

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
  }
}

export async function* sip(stream, { signal } = {}) {
  const buffer = new Utf8CharBuffer()
  const destroy = () => stream.destroy(new AbortError())

  try {
    signal?.addEventListener('abort', destroy, { once: true })
    
    // Strings are expensive so use a string builder.
    for await (const chunk of stream) {
      for (const byte of chunk) {
        buffer.push$(byte)
        if (buffer.canStringify) {
          yield { eof: false, buffer }
        }
      }
    }

    yield { eof: true, buffer }
  } finally {
    signal?.removeEventListener('abort', destroy)
  }
}

// dispose
// pipe
// rest
