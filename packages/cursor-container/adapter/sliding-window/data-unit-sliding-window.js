import { TrimmedSlidingWindow } from "./trimmed-sliding-window.js"
import { tryAdvance, tryRewind, rewind } from "@kingjs/cursor-algorithm"

// DataUnitSlidingWindow is a TrimmedSlidingWindow that defines its
// end cursor position as the position of its inner cursor less the remainder
// of a count (as a function of the inner window) divided by a modulous. 

// Example: If the inner window is a byte stream representing UTF-16 code 
// units, the modulous would be 2 and the end cursor would be positioned 
// at one byte past the last byte of the last code unit in the inner window.
export class DataUnitSlidingWindow extends TrimmedSlidingWindow {
  constructor(window) {
    super(window)
  }

  get modulous$() { throw new Error("Not implemented.") }
  get count$() { throw new Error("Not implemented.") }

  next$(innerCursor) { throw new Error("Not implemented.") }

  trim$(innerCursor) {
    const countFn = this.count$
    const modulous = this.modulous$
    const innerWindow = this.innerWindow$

    const count = countFn(innerWindow)
    const remainder = count % modulous
    rewind(innerCursor, remainder)
  }

  step$(innerCursor) {
    const modulous = this.modulous$
    return tryAdvance(innerCursor, modulous)
  }

  stepBack$(innerCursor) {
    const modulous = this.modulous$
    return tryRewind(innerCursor, modulous)
  }

  get modulous() { 
    return this.modulous$ 
  }
}
