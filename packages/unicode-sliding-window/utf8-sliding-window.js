import { CodePointSlidingWindow } from "./code-point-sliding-window.js"

export class Utf8SlidingWindow extends CodePointSlidingWindow {
  static codeUnitByteLength = 1

  constructor({ littleEndian = false } = { }) {
    const { codeUnitByteLength } = Utf8SlidingWindow
    super({
      littleEndian,
      unitLength: codeUnitByteLength, 
    })
  }

  decodeLength$(codeUnit) {
    if (codeUnit < 0x80) return 1 // 1 byte
    if (codeUnit < 0xE0) return 2 // 2 bytes
    if (codeUnit < 0xF0) return 3 // 3 bytes
    if (codeUnit < 0xF8) return 4 // 4 bytes
    return null
  }
  decodeValue$(cursor) {
    let codeUnit = cursor.value
    if (codeUnit == null) return // end of inner window

    const length = this.decodeLength$(codeUnit)
    if (length == null) throw new Error(
      "Invalid UTF-8 code unit: " + codeUnit.toString(16))

    let codePoint
    switch (length) {
      case 1: codePoint = codeUnit; break
      case 2: codePoint = codeUnit & 0b00011111; break
      case 3: codePoint = codeUnit & 0b00001111; break
      case 4: codePoint = codeUnit & 0b00000111; break
    }

    cursor.step()
    for (let i = 1; i < length; i++) {
      codeUnit = cursor.value
      codePoint = (codePoint << 6) | (codeUnit & 0b00111111)
      cursor.step()
    }

    return codePoint
  }
} 
