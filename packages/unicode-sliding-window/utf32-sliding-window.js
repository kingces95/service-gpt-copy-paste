import { CodePointSlidingWindow } from "./code-point-sliding-window.js"
import { CodeUnitSlidingWindow } from "./code-unit-sliding-window.js"

// Utf32SlidingWindow is included for completeness, but it is not
// commonly used in practice since UTF-32 is not space-efficient.

// This class is not tested. It is included just to demonstrate how
// the overall sliding window architecture would work with UTF-32.
export class Utf32SlidingWindow extends CodePointSlidingWindow {
  static codeUnitByteLength = 4
  
  constructor({ littleEndian = false } = { }) {
    const { codeUnitByteLength } = Utf32SlidingWindow
    super({
      littleEndian,
      unitLength: codeUnitByteLength, 
    })
  }

  decodeLength$(codeUnit) { return 1 }
  decodeValue$(cursor) { return cursor.value }
}
