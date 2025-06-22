import { CodePointSlidingWindow } from "./code-point-sliding-window.js"

export class Utf16SlidingWindow extends CodePointSlidingWindow {
  static codeUnitByteLength = 2

  constructor({ littleEndian = false } = { }) {
    const { codeUnitByteLength } = Utf16SlidingWindow
    super({
      littleEndian,
      unitLength: codeUnitByteLength, 
    })
  }

  decodeLength$(codeUnit) {
    if (codeUnit < 0xD800 || codeUnit > 0xDFFF) return 1 // BMP character
    if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF) return 2 // high surrogate
    return null
  }
  decodeValue$(cursor) {
    let codeUnit = cursor.value
    if (codeUnit == null) return // end of inner window
    cursor.step()

    const length = this.decodeLength$(codeUnit)
    if (length == null) throw new Error(
      "Invalid UTF-16 code unit: " + codeUnit.toString(16))

    if (length === 1) return codeUnit // BMP character

    const highSurrogate = codeUnit - 0xD800
    
    codeUnit = cursor.value
    cursor.step()
    const lowSurrogate = codeUnit - 0xDC00

    const codePoint = (highSurrogate << 10) + lowSurrogate + 0x10000
    return codePoint
  }
}
