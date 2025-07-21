import { Range } from "../range/range.js"
import { Interval } from "../interval.js"
import {
  throwNotImplemented
} from '../throw.js'

export class CursorFactory extends Interval {  
  static get cursorType() { return this.cursorType$ }

  constructor() { 
    super()
  }

  // cursor
  equatableTo$$(otherCursor) { throwNotImplemented() }
  equatableTo$(otherCursor) {
    const type = this.constructor.cursorType
    const otherType = otherCursor?.constructor
    if (type !== otherType) return false
    return this.equatableTo$$(otherCursor)
  } 
  
  // A subclass can use this method to activate a cursor. If recyclable is 
  // provided, it will be recycled, otherwise a new cursor will be created.
  cursor$(recyclable, ...args) {
    const type = this.constructor.cursorType$
    let cursor = recyclable 
      ? recyclable.recycle$(this, ...args) 
      : new type(this, ...args)

    return cursor
  }
  
  // interval
  toRange() { return new Range(this.begin(), this.end()) }

  // cursor factory
  get isEmpty() { return this.begin().equals(this.end()) }
  beforeBegin(recyclable) { throwNotImplemented() }
  begin(recyclable) { throwNotImplemented() }
  end(recyclable) { throwNotImplemented() }
  
  // Deconstruct a cursor to its underlying components. The STL version only
  // returns a buffer and index if the container is contiguous, but this version
  // will also return a set of inner cursors of composit view cursors.
  // Unwrap a cursor to an array cursors or buffer plus index. For example,
  // - JoinView returns [outterCursor, innerCursor]
  // - ComposedView returns [cursor] 
  // - ContiguousContainer returns [buffer, index]
  // - Vector return null because it's neither a composition of other cursors
  //   nor does it have an underlying buffer
  data$(cursor) { return }
  data(cursor) {
    if (cursor == undefined) 
      return

    if (!(cursor instanceof this.constructor.cursorType))
      throw new Error("Cursor is not a valid cursor for this view.")

    this.data$(cursor)
  }

  // cursor factory
  cbeforeBegin(recyclable) {
    const beforeBegin = this.beforeBegin(recyclable)
    beforeBegin.isReadOnly = true
    return beforeBegin
  }
  cbegin(recyclable) {
    const begin = this.begin(recyclable)
    begin.isReadOnly = true
    return begin
  }
  cend(recyclable) {
    const end = this.end(recyclable)
    end.isReadOnly = true
    return end
  }
}
