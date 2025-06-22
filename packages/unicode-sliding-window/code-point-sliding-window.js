import { stepBackUntil, tryAdvance } from "@kingjs/cursor"
import { CodeUnitSlidingWindow } from "./code-unit-sliding-window.js"
import { TrimmedSlidingWindow } from "./trimmed-sliding-window.js"

// A code point is a sequence of one or more code units that represents a
// single unicode character. For example, in UTF-8, a code point can be
// represented by one to four code units, while in UTF-16, a code point
// can be represented by one or two code units depending on whether it is
// a basic multilingual plane (BMP) character or a supplementary character.
// The former is encoded in a single code unit, while the latter is encoded
// in a surrogate pair of code units. Finally, in UTF-32, a code point
// is always represented by a single code unit.

// CodePointSlidingWindow abstracts away code unit boundaries and allows
// the user to iterate over code points. 

// Extensions are expected to override the following functions:

// - decodelength$(codeUnit): 
//   returns the length in code-units of the code-point given an aligned 
//   code-unit or null if the code-unit is not aligned.

// - decodeValue$(innerCursor): 
//   returns the code point value at the position of the inner cursor. The 
//   function is called with the inner cursor of the inner window and should 
//   return the code point value at the position of the inner cursor. The 
//   function may assume the inner cursor is aligned to a code point boundary.
//   The function should advance the inner cursor to the next code point
//   boundary after reading the code point value. If the inner cursor is at the
//   end of the inner window, the function should return undefined and not
//   advance the cursor.
export class CodePointSlidingWindow extends TrimmedSlidingWindow {
  constructor({
    unitLength = 1, 
    littleEndian = false, 
  } = { }) {
    super(new CodeUnitSlidingWindow({ unitLength, littleEndian }))
  }

  decodeLength$(codeUnit) { throw new Error("Not implemented.") }
  decodeValue$(innerCursor) { throw new Error("Not implemented.") }

  trim$(innerCursor) {

    // search for the last aligned code unit
    if (!this.stepBack$(innerCursor))
      return // no aligned code unit found; begin == end

    // advance to one past the last aligned code unit
    this.step$(innerCursor)
  }

  step$(innerCursor) {
    const value = innerCursor.value
    if (value == null) return false // end of inner window
    return tryAdvance(innerCursor, this.decodeLength$(value))
  }

  stepBack$(innerCursor) {
    return stepBackUntil(innerCursor, o => this.decodeLength$(o) != null)
  }

  next$(innerCursor) {
    return this.decodeValue$(innerCursor)
  }
}
