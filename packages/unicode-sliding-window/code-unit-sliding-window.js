import { TrimmedSlidingWindow } from "./trimmed-sliding-window.js"
import { ByteSlidingWindow } from "@kingjs/byte-sliding-window"
import { tryAdvance, tryRewind, rewind } from "@kingjs/cursor"

// A code unit is a sequence of bytes of a constant length that represents a 
// single character in a character encoding. For example, in UTF-8, a
// code unit is a single byte, while in UTF-16, a code unit is two bytes.

// The length of the code unit can be used as a modulus to determine the 
// alignment of the cursor; If the remainder of the position of a byte in 
// a stream divided by the code unit length is zero, then the position is 
// the beginning of a code unit.

// A sequence of bytes containing code units is typically delivered in 
// chunks the ending of which may not align with code unit boundaries.
// CodeUnitwindow abstracts away the chunking and allows the user to
// iterate over the code units without regard to chunk boundaries.
export class CodeUnitSlidingWindow extends TrimmedSlidingWindow {
  static #getByteOrderMark(unitLength) {
    switch (unitLength) {
      case 1: return 0xEFBBBF; // UTF-8 BOM
      case 2: return 0xFEFF; // UTF-16 BOM
      case 4: return 0x0000FEFF; // UTF-32 BOM
      default: throw new Error("Unsupported code unit length.");
    }
  }

  #unitLength
  #littleEndian
  #isLittleEndianDefault
  
  constructor({ unitLength = 1, littleEndian = false } = { }) {
    super(new ByteSlidingWindow())
    this.#unitLength = unitLength
    this.#isLittleEndianDefault = littleEndian

    if (unitLength == 1)
      // utf-8 byte order mark is handled (ignored) at the code point level
      this.#littleEndian = false 
    else if (unitLength == 2 || unitLength == 4) {
      // initilization deferred until the first chunk is pushed
      this.#littleEndian = undefined
    } else throw new Error(
      "Unsupported code unit length: " + unitLength)
  }

  #initialize() {
    if (this.#littleEndian == null) {
      const current = this.begin()
      if (current.isEnd) return // no data to initialize with

      const unitLength = this.#unitLength
      const innerWindow = this.innerWindow$
      const innerCursor = innerWindow.begin()
      const byteOrderMarkLE = this.#value(innerCursor, true)
      const byteOrderMarkBE = this.#value(innerCursor, false)

      const byteOrderMark = CodeUnitSlidingWindow.#getByteOrderMark(unitLength)
      this.#littleEndian = byteOrderMarkLE == byteOrderMark
        ? true
        : byteOrderMarkBE == byteOrderMark
          ? false
          : null

      // throw of BOM is not recognized and no default endianess provided 
      if (typeof this.#littleEndian !== 'boolean') {
        this.#littleEndian = this.#isLittleEndianDefault
        return
      }

      current.next() // advance the begin cursor to skip the BOM
      this.shift(current) // skip the BOM
    }
  }

  #value(innerCursor, littleEndian = this.isLittleEndian) {
    const unitLength = this.#unitLength
    const signed = false // code units are unsigned
    return innerCursor.read(unitLength, signed, littleEndian)
  }

  // Activation of the end cursor is complicated becuase the position one 
  // past the last byte in the last chunk may not align with the code unit 
  // boundary so may have to be adjusted to the last byte of the last
  // code unit in the last chunk. This adjustment is done by rewinding the
  // inner cursor by the remainder of the byte count divided by the
  // code unit length. 
  trim$(innerCursor) {
    const innerWindow = this.innerWindow$
    const byteCount = innerWindow.count
    const byteRemainder = byteCount % this.#unitLength
    rewind(innerCursor, byteRemainder)
  }

  next$(innerCursor, littleEndian = this.isLittleEndian) {
    // assume the inner cursor is not at the end of the inner window
    const result = this.#value(innerCursor, littleEndian)
    if (result == null) return
    this.step$(innerCursor) // advance the inner cursor
    return result
  }

  step$(innerCursor) {
    const unitLength = this.#unitLength
    return tryAdvance(innerCursor, unitLength)
  }

  stepBack$(innerCursor) {
    const unitLength = this.#unitLength
    return tryRewind(innerCursor, unitLength)
  }

  get isLittleEndian() { 
    return this.#littleEndian 
  }
  get unitLength() { 
    return this.#unitLength 
  }

  push(chunk) {
    super.push(chunk)
    this.#initialize()
  }
}
