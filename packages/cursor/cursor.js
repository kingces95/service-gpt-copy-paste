export class Cursor {
  #__version
  #container

  constructor(container) {
    this.#container = container
    this.#initialize()
  }

  #initialize() {
    this.#__version = this.#container.__version$
  }

  get container$() { return this.#container }

  recycle$(container) {
    if (container != this.#container) 
      throw new Error("Cursor cannot be recycled to a different container.")

    const newVersion = container.__version$
    const oldVersion = this.#__version
    if (oldVersion !== undefined && newVersion == oldVersion) 
      throw new Error("Cursor cannot be recycled while still active.")
    this.#initialize()
  }

  __throwIfStale$() {
    if (!this.isActive) throw new Error(
      "Container has been popped since cursor was created.")
  }

  get isActive() {
    const container = this.#container
    const version = container.__version$
    return version == this.#__version
  }

  get isEnd() { throw new Error("Not implemented.") }
  get isBegin() { throw new Error("Not implemented.") }
  get value() { throw new Error("Not implemented.") }
  step() { throw new Error("Not implemented.") }

  equals(other) { throw new Error("Not implemented.") }
}

export class ForwardCursor extends Cursor {

  constructor(container) {
    super(container)
  }

  clone() { throw new Error("Not implemented.") }
} 

export class BidirectionalCursor extends ForwardCursor {
  constructor(container) {
    super(container)
  }

  stepBack() { throw new Error("Not implemented.") }
} 

export class SlidingWindowCursor extends BidirectionalCursor {
  constructor(window) {
    super(window)
  }

  get value() {
    const result = this.next()
    if (result == null) return
    this.stepBack()
    return result
  }

  // In practice, sliding window cursors are layered such that decoding
  // the value of one may require many steps of an inner cursor. For example,
  // a utf-16 cursor may need to step through multiple code units to decode
  // a single code point. This method allows for optimized reading in this
  // case. Without this method, reading a value would require rewinding the
  // inner cursor to the beginning of its decoding operation.
  next() {
    const result = this.value
    if (result == null) return
    this.step()
    return result
  }
}