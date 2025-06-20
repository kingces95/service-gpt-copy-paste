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
  #byteOrderMark
  #littleEndian
  #isLittleEndianDefault
  
  constructor({ unitLength = 1, littleEndian = false } = { }) {
    super(new ByteSlidingWindow())
    this.#unitLength = unitLength
    this.#isLittleEndianDefault = littleEndian
    this.#byteOrderMark = CodeUnitSlidingWindow.#getByteOrderMark(unitLength)
  }

  #initialize() {
    if (this.#littleEndian === undefined) {
      const begin = this.begin()
      const end = this.end()
      if (begin.equals(end)) return // no data to initialize with

      const innerWindow = this.innerWindow$
      const innerCursor = innerWindow.begin()
      const byteOrderMarkLE = this.getValue$(innerCursor, true)
      const byteOrderMarkBE = this.getValue$(innerCursor, false)

      const byteOrderMark = this.#byteOrderMark
      this.#littleEndian = byteOrderMarkLE == byteOrderMark
        ? true
        : byteOrderMarkBE == byteOrderMark
          ? false
          : this.#isLittleEndianDefault

      // throw of BOM is not recognized and no default endianess provided 
      if (typeof this.#littleEndian !== 'boolean') throw new Error(
        "Invalid byte order mark. Expected 0xEFBBBF, 0xFEFF, or 0x0000FEFF.")
    }
  }

  // Activation of the end cursor is complicated becuase the position one 
  // past the last byte in the last chunk may not align with the code unit 
  // boundary so may have to be adjusted to the last byte of the last
  // code unit in the last chunk. This adjustment is done by rewinding the
  // inner cursor by the remainder of the byte count divided by the
  // code unit length. 
  alignEndCursor$(innerCursor) {
    const innerWindow = this.innerWindow$
    const byteCount = innerWindow.count
    const byteRemainder = byteCount % this.#unitLength
    rewind(innerCursor, byteRemainder)
  }

  getValue$(innerCursor, littleEndian = this.isLittleEndian) {
    const length = this.#unitLength
    const signed = false // code units are unsigned
    return innerCursor.read(length, signed, littleEndian)
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
    this.__throwIfDisposed$()
    return this.#littleEndian 
  }
  get unitLength() { 
    this.__throwIfDisposed$()
    return this.#unitLength 
  }
  get count() { 
    const unitLength = this.#unitLength
    const innerWindow = this.innerWindow$
    const byteCount = innerWindow.count
    return Math.floor(byteCount / unitLength)
  }

  push(chunk) {
    super.push(chunk)
    this.#initialize()
  }
}
