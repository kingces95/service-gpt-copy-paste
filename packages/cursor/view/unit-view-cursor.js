import { Cursor } from '../cursor.js'

export class UnitViewCursor extends Cursor {
  #unit

  constructor(view, cursor, unit) {
    super(view, cursor)
    this.#unit = unit
  }

  get unit$() { return this.#unit }

  get isEnd() { 
    const { cursor$: innerCursor } = this
    return !innerCursor
  }
  get isBegin() { 
    const { cursor$: innerCursor, outterCursor$: outterCursor } = this
    return innerCursor?.isBegin && outterCursor.isBegin
  }
  get value() { 
    const { cursor$: innerCursor } = this
    return innerCursor?.value
  }

  equals(other) { 
  }

  clone() { 
  }

  next() {
  }

  step(offset) { 
    return true
  }

  stepBack(offset) { 
    return true
  }
}