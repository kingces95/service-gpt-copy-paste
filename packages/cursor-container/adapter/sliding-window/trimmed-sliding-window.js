import { SlidingWindow } from "./index.js"
import { IterableCursor } from "../../../cursor/iterable-cursor.js"

// TrimmedSlidingWindow exposes an inner sliding window whose end cursor
// is aligned to a higher-level abstraction. For example, a code-unit is
// a trimmed sliding window of a byte sliding window where the end cursor
// is stepped back until it is aligned to a code-unit boundary. Similarly,
// a code-point sliding window is a trimmed sliding window of a code-unit
// sliding window where the end cursor is stepped back until it is aligned
// to a code-point boundary.

// TrimmedSlidingWindow is an abstract class and extensions are expected to
// implement the following functions:

// - innerWindow$
//   the inner window being trimmed.

// - trim$(innerCursor) 
//   used to align the end cursor of the inner window to a higher-level 
//   abstraction. The function is called with the end inner cursor of the 
//   inner window and should step back the cursor until it is aligned to the 
//   higher-level abstraction. For example, in a code-unit sliding window,
//   the function would step back the end inner cursor until it is aligned
//   to a code-unit boundary which is a function of the cursor position. 
//   Alternatively, in a code-point sliding window, the function would step back
//   the end inner cursor until it is aligned to a code-point boundary which
//   is a function of the cursor value (a continuation for utf-8 and a high
//   surrogate for utf-16).

// - next$(innerCursor) 
//   used to read the value of the inner cursor and step. The function is called 
//   with the inner cursor and should return the value of the higher-level abstraction 
//   at the position of the innerCursor and advance the cursor one step of the
//   higher-level abstraction. Implementation may assume the inner cursor is
//   not at the end of the inner window.

// - step$(innerCursor) 
// - stepBack$(innerWindow) 
//   used to step the inner cursor forward or backward until it is aligned with 
//   the higher-level abstraction. The callback may assume the iterator it not
//   at the end or beginning of the outer window, respectively.
export class TrimmedSlidingWindow extends SlidingWindow {
  static get Cursor() { return TrimmedSlidingWindowCursor }

  #innerWindow
  #endInnerCursor
  #beginInnerCursor

  constructor(innerWindow) {
    super()
    this.#innerWindow = innerWindow
  }

  next$(innerCursor) { throw new Error("Not implemented.") }
  step$(innerCursor) { throw new Error("Not implemented.") }
  stepBack$(innerCursor) { throw new Error("Not implemented.") }
  trim$(innerCursor) { throw new Error("Not implemented.") }

  get innerWindow$() { return this.#innerWindow }

  get beginInnerCursor$() {
    if (!this.#beginInnerCursor) {
      const innerWindow = this.innerWindow$
      const innerCursor = innerWindow.begin()
      this.#beginInnerCursor = innerCursor
    }
    return this.#beginInnerCursor
  }
  get endInnerCursor$() {
    if (!this.#endInnerCursor) {
      const innerWindow = this.innerWindow$
      const innerCursor = innerWindow.end()
      this.trim$(innerCursor)
      this.#endInnerCursor = innerCursor
    }
    return this.#endInnerCursor
  }

  begin(recyclable) { 
    super.begin(recyclable)
    const beginInnerCursor = this.beginInnerCursor$
    return this.cursor$(recyclable, beginInnerCursor.clone()) 
  }
  end(recyclable) { 
    super.end(recyclable)
    const endInnerCursor = this.endInnerCursor$
    return this.cursor$(recyclable, endInnerCursor.clone()) 
  }

  push(chunk) {
    super.push(chunk)
    const innerWindow = this.innerWindow$
    this.#endInnerCursor = null
    innerWindow.push(chunk)
  }

  shift(cursor = this.end()) {
    super.shift(cursor)
    const innerWindow = this.innerWindow$
    const innerCursor = cursor.innerCursor$
    const result = innerWindow.shift(innerCursor)

    // Using a cursor to track begin/end position, or caching any cursor, 
    // requires clearing the cached cursor when it is invalidated due
    // to a shift operation.
    this.#beginInnerCursor = null
    this.#endInnerCursor = null

    return result
  }

  dispose() {
    super.dispose()
    const innerWindow = this.innerWindow$
    const result = innerWindow.dispose()
    this.#endInnerCursor = null
    this.#beginInnerCursor = null
    return result
  }
}

class TrimmedSlidingWindowCursor extends IterableCursor {
  #innerCursor

  constructor(window, innerCursor) {
    super(window)
    this.#innerCursor = innerCursor
  }

  get innerCursor$() { return this.#innerCursor }

  get isEnd() {
    if (!this.__isActive) this.__throwStale$() 
    const window = this.container
    const endInnerCursor = window.endInnerCursor$
    const innerCursor = this.#innerCursor
    return innerCursor.equals(endInnerCursor)
  }

  get isBegin() {
    if (!this.__isActive) this.__throwStale$()
    const window = this.container
    const beginInnerCursor = window.beginInnerCursor$
    const innerCursor = this.#innerCursor
    return innerCursor.equals(beginInnerCursor)
  }
  
  next() {
    if (!this.__isActive) this.__throwStale$()
    if (this.isEnd) return
    const window = this.container
    const innerCursor = this.#innerCursor
    return window.next$(innerCursor)
  }

  step() {
    if (!this.__isActive) this.__throwStale$()
    const innerCursor = this.#innerCursor
    const window = this.container
    return window.step$(innerCursor)
  }

  stepBack() {
    if (!this.__isActive) this.__throwStale$()
    const innerCursor = this.#innerCursor
    const window = this.container
    return window.stepBack$(innerCursor)
  }

  clone() {
    if (!this.__isActive) this.__throwStale$()
    const window = this.container
    const innerCursor = this.#innerCursor
    return new TrimmedSlidingWindowCursor(window, innerCursor.clone())
  }

  equals(other) {
    if (!this.__isActive) this.__throwStale$()
    const window = this.container
    const otherWindow = other.container
    if (window != otherWindow) return false

    const innerCursor = this.#innerCursor
    const otherInnerCursor = other.innerCursor$
    return innerCursor.equals(otherInnerCursor)
  }
}  
