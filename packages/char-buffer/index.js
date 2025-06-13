import assert from 'assert'
import { StringDecoder } from 'string_decoder'

const ENCODING_UTF8 = 'utf8'

// Helper for UTF-8 byte analysis
const Utf8 = {
  bytesInChar(byte) {
    if ((byte & 0b10000000) === 0) return 1
    if ((byte & 0b11100000) === 0b11000000) return 2
    if ((byte & 0b11110000) === 0b11100000) return 3
    if ((byte & 0b11111000) === 0b11110000) return 4
    throw new Error('Invalid UTF-8 start byte.')
  },
  isSingleByte(byte) {
    return (byte & 0b10000000) === 0
  },
  isStartByte(byte) {
    return (byte & 0b11000000) !== 0b10000000
  }
}

// CharBuffer is a container for bytes that can be decoded into characters.
// 
// A producer can call `push()` to push a chunk into the CharBuffer.
//
// A consumer can call `begin()` to access CharPointer that point to the 
// start of the string in the buffer.
export class CharBuffer {
  #chunks
  constructor() {
    this.#chunks = []
  }

  get chunks$() { return this.#chunks }
  begin() { return new CharPointer(this) }
  end() { 
    const pointer = new CharPointer(this, this.#chunks.length, 0)
    pointer.rewind() // little hack to find the last start byte
    pointer.advance() // advance if the last char is complete
    return pointer
  }

  push(chunk) { 
    if (chunk == null)
      throw new Error('Cannot push null or undefined chunk into CharBuffer.')
    
    if (chunk.length == 0)
      return // nothing to push
      
    this.#chunks.push(chunk)
  }

  toString() {
    return this.begin().toString()
  }
}

// CharPointer points to the first byte of a character in a CharBuffer or
// is a sentinel that either (1) points to the first byte of the trailing 
// imcomplete character or (2) is a dangling and points to the first byte 
// of the first character in the next chunk which has yet to be pushed.
// 
// CharPointer can be advanced or rewound to traverse the characters in the 
// buffer. See `advance()` and `rewind()` methods. These methods will
// return false if the pointer cannot be advanced or rewound either because
// the pointer would go past the start or the sentinel.
// 
// CharPointers can be compared to determine their relative position. 
// See `compareTo()` method.
//
// CharPointer can be cloned to create a new pointer that points to the same
// character in the buffer. See `clone()` method.
//
// CharPointer can be used to test if the character being pointer at matches
// a given set of characters passed as a byte, buffer, or string (e.g. IFS). 
// See `test()` method.
export class CharPointer {
  #buffer
  #chunkIndex // the chunk index in the CharBuffer
  #byteIndex // the byte index in the chunk
  constructor(buffer, chunkIndex = 0, byteIndex = 0) {
    this.#buffer = buffer
    this.#chunkIndex = chunkIndex
    this.#byteIndex = byteIndex
  }

  get chunks$() { return this.#buffer.chunks$ }
  get chunkIndex$() { return this.#chunkIndex }
  get byteIndex$() { return this.#byteIndex }

  clone() { 
    return new CharPointer(this.#buffer, this.#chunkIndex, this.#byteIndex) 
  }
  test(value) {
    const { chunks$: chunks } = this
    let { chunkIndex$: chunkIndex, byteIndex$: byteIndex } = this
    const chunk = chunks[chunkIndex]

    // charOrByteOrBytes is a byte (test against the byte at the pointer)
    const isByte = typeof value === 'number'
    if (isByte) {
      if (chunk == null) return false // no chunk to test against
      const byte = chunk[byteIndex]

      // if the target character is multi-byte, it cannot match
      if (!Utf8.isSingleByte(byte))
        return false

      return byte === value
    }
    
    // charOrByteOrBytes is a string (convert to buffer)
    const isString = typeof value === 'string'
    if (isString)
      value = Buffer.from(value, ENCODING_UTF8)

    const isBuffer = Buffer.isBuffer(value)
    if (!isBuffer) throw new Error(
      'Value must be a byte, string, or buffer.')
    if (chunk == null) return false // no chunk to test against

    // alias the charOrByteOrBytes to a buffer for easier handling
    const bytes = value
    const bytesInChar = Utf8.bytesInChar(bytes[0])

    // charOrByteOrBytes contains many characters (recurse)
    if (bytes.length > bytesInChar) {
      for (let i = 0, j = bytesInChar; 
        i < bytes.length; 
        i += j, j = Utf8.bytesInChar(bytes[i])) {

        if (this.test(bytes.slice(i, i + j)))
          return true
      }
      
      return false
    }

    // charOrByteOrBytes is a buffer containing one character (general case)
    let currentChunk = chunk
    for (let i = 0; i < bytes.length; i++, byteIndex++) {
      const chunkByte = currentChunk[byteIndex]

      if (chunkByte == null) {
        if (++chunkIndex == chunks.length)
          return false // no more chunks to test against

        // move to the next chunk
        currentChunk = chunks[chunkIndex]
        byteIndex = 0

        // retry the byte in the next chunk
        byteIndex-- 
        i--
        continue
      }

      if (chunkByte !== bytes[i]) 
        return false
    }
    return true
  }
  advance() { 
    const { chunks$: chunks } = this
    let { chunkIndex$: chunkIndex, byteIndex$: byteIndex } = this

    // get the current chunk
    let chunk = chunks[chunkIndex]

    // a null chunk with a byte index of 0 is valid and indicates 
    // the last chunk pushed into the buffer has no partial characters
    assert(chunk != null || byteIndex == 0)
    if (chunk == null) return false

    // get the first byte of the current char
    const byte = chunk[byteIndex]
    
    // advance by byte count in the current char
    byteIndex += Utf8.bytesInChar(byte)

    // if the byte index is past the end of the chunk, move to the next chunk
    while (chunk != null && byteIndex >= chunk.length) {
      byteIndex -= chunk.length
      chunk = chunks[++chunkIndex]
    }

    // test if the last char is incomplete
    if (chunk == null && byteIndex > 0) return false

    // the pointer has been advanced
    this.#chunkIndex = chunkIndex
    this.#byteIndex = byteIndex
    return true   
  }
  rewind() { 
    const { chunks$: chunks } = this
    let { chunkIndex$: chunkIndex, byteIndex$: byteIndex } = this

    while (true) {
      let chunk = chunks[chunkIndex]

      // if the byte index is at the start of the chunk, move to the previous chunk
      if (byteIndex === 0) {
        if (chunkIndex === 0) return false // cannot rewind past the start
        chunk = chunks[--chunkIndex]
        byteIndex = chunk.length
      }

      // rewind by one byte
      byteIndex--

      // if the byte is not a start byte, we have an icomplete character
      if (!Utf8.isStartByte(chunk[byteIndex]))
        continue

      break
    }

    // the pointer has been rewound
    this.#chunkIndex = chunkIndex
    this.#byteIndex = byteIndex
    return true
  }
  compareTo(other) {
    if (this === other) return 0
    if (this.#buffer !== other.#buffer) throw new Error(
      'Cannot compare pointers from different CharBuffers.')
    if (this.#chunkIndex !== other.#chunkIndex)
      return this.#chunkIndex < other.#chunkIndex ? -1 : 1
    if (this.#byteIndex === other.#byteIndex) 
      return 0
    return this.#byteIndex < other.#byteIndex ? -1 : 1
  }
  toString(end, { encoding = ENCODING_UTF8 } = {}) {
    // To achive maximally memory efficient string decoding buffer copying 
    // must be avoided. Naive string decoding given bytes spanning multiple
    // chunks would require copying the bytes into a new buffer and then
    // decoding the buffer into a string. Copying into a new buffer can be
    // avoided using StringBuilder which uses a small buffer to bridge chunk
    // that split characters. 

    // Modern JavaScript engines optimize string concatenation
    // using ropes. Ropes are efficient for clients that treat strings as 
    // literals (e.g. clients compare strings and do not interrogate their
    // individual characters via indexing or regexs). Since this class is
    // designed to be used with a bash inspired abstraction where most
    // strings are treated as literals, strings are built using robes. 
    const { chunks$: chunks } = this
    const { chunkIndex$: chunkBegin, byteIndex$: byteBegin } = this

    // special case: missing end pointer
    // If there is no end pointer, decode everything from the start. Since
    // such a string is unlikely to be used as a literal, a rope would be
    // a waste of memory since the result would likely be interrogated
    // to interpret the string otherwise the client should pipe the bytes.
    if (!end)
      return this.toString(this.#buffer.end(), { encoding })

    // trivial case: begin and end pointers are the same
    const comparison = this.compareTo(end)
    if (comparison > 0) 
      throw new Error('End pointer is before the start pointer.')
    if (comparison === 0) return '' // same pointer, nothing to decode

    const { 
      chunkIndex$: chunkEnd, 
      byteIndex$: byteEnd 
    } = end

    // special case: begin and end pointers are in the same chunk
    if (chunkBegin === chunkEnd) {
      // if the begin and end pointers are in the same chunk, slice the chunk
      const chunk = chunks[chunkBegin]
      return chunk.slice(byteBegin, byteEnd).toString(encoding)
    }

    // general case: begin and end pointers are in different chunks

    // slice off leading and trailing chunks
    const chunksSlice = chunks.slice(chunkBegin, 
      // if the end pointer is at the start of the chunk, exclude the chunk
      // since that implies all of the bytes in the chunk are excluded
      chunkEnd + (byteEnd ? 1 : 0))
    
    // trim the first chunk
    if (byteBegin) {
      chunksSlice[0] = chunksSlice.at(0).slice(byteBegin)
    }
    
    // trim the last chunk
    if (byteEnd) { // if byteEnd is 0, chunksSlice excludes the whole chunk
      const lastChunkIndex = chunksSlice.length - 1
      chunksSlice[lastChunkIndex] = chunksSlice.at(-1).slice(0, byteEnd)
    }
    
    // reduce the chunks into a single string
    const decoder = new StringDecoder(encoding)
    const [firstChunk, ...restChunks] = chunksSlice
    return restChunks.reduce((result, chunk) => {
      result += decoder.write(chunk)
      return result
    }, decoder.write(firstChunk))
  }
}
