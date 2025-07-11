import { Range } from "../range/range.js"
import { Interval } from "../interval.js"
import { CursorAbility as Ability } from "./cursor-abilitiy.js"

export class CursorFactory extends Interval {
  
  static get cursorType() { return this.cursorType$ }
  static get abilities() { return this.cursorType.abilities }
  static get isInput() { return Ability.isInput(this.abilities) }
  static get isOutput() { return Ability.isOutput(this.abilities) }
  static get isForward() { return Ability.isForward(this.abilities) }
  static get isBidirectional() { return Ability.isBidirectional(this.abilities) }
  static get isRandomAccess() { return Ability.isRandomAccess(this.abilities) }
  static get isContiguous() { return Ability.isContiguous(this.abilities) }

  static get cursorType$() { this.throwNotImplemented$() }

  constructor() { 
    super()
  }

  throwNotImplemented$() { throw new Error("Not implemented.") }
  throwNotSupported$() { throw new Error("Not supported.") }
  throwUnequatable$() { throw new TypeError(
    'Cannot compare cursors of a sequence container that is not equatable.') }
  throwWriteOutOfBounds$() { throw new RangeError(
    'Cannot write value out of bounds of cursor.') }

  // cursor implementation
  equatableTo$$(otherCursor) { this.throwNotImplemented$() }

  // cursor proxy
  equatableTo$(otherCursor) {
    const type = this.cursorType
    const otherType = otherCursor?.constructor
    if (type !== otherType) return false
    return this.equatableTo$$(otherCursor)
  } 
  
  get isEmpty$() { return this.begin().equals(this.end()) }
  
  // A subclass can use this method to activate a cursor. If recyclable is 
  // provided, it will be recycled, otherwise a new cursor will be created.
  cursor$(recyclable, ...args) {
    const Cursor = this.constructor.cursorType$
    return recyclable 
      ? recyclable.recycle$(this, ...args) 
      : new Cursor(this, ...args)
  }
  
  begin$(recyclable) { throwNotImplemented$() }
  end$(recyclable) { throwNotImplemented$() }
  toRange$() { return new Range(this.begin(), this.end()) }

  // Unwrap a cursor to an array cursors or buffer plus index. For example,
  // - JoinView returns [outterCursor, innerCursor]
  // - ComposedView returns [cursor] 
  // - ContiguousContainer returns [buffer, index]
  // - Vector return null because it's neither a composition of other cursors
  //   nor does it have an underlying buffer
  data$(cursor) { return }
  
  get isEmpty() { return this.isEmpty$ }
  get cursorType() { return this.constructor.cursorType }
  get isInput() { return this.constructor.isInput }
  get isOutput() { return this.constructor.isOutput }
  get isForward() { return this.constructor.isForward }
  get isBidirectional() { return this.constructor.isBidirectional }
  get isRandomAccess() { return this.constructor.isRandomAccess }
  get isContiguous() { return this.constructor.isContiguous }
  
  // Deconstruct a cursor to its underlying components. The STL version only
  // returns a buffer and index if the container is contiguous, but this version
  // will also return a set of inner cursors of composit view cursors.
  data(cursor) {
    if (cursor == undefined) 
      return

    if (!(cursor instanceof this.cursorType))
      throw new Error("Cursor is not a valid cursor for this view.")

    this.data$(cursor)
  }

  begin(recyclable) { return this.begin$(recyclable) }
  end(recyclable) { return this.end$(recyclable) }

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
