import { RewindContainer } from '../rewind-container.js'
import { IndexableCursor } from './indexable-cursor.js'

export class IndexableContainer extends RewindContainer {
  static get cursorType$() { return IndexableCursor }

  constructor() {
    super()
  }

  isInBounds$(index, offset) {
    const indexOffset = index + offset
    if (indexOffset < 0) return false
    if (indexOffset >= this.count) return false
    return true
  }
  isInBoundsOrEnd$(index, offset) {
    const indexOffset = index + offset
    return indexOffset == this.count || this.isInBounds$(index, offset)
  }

  // cursor implementation
  isEnd$$(index) { return index == this.count }
  isBegin$$(index) { return index == 0 }
  value$$(index) { return this.at$(index, 0) }
  step$$(index) { return this.move$$(index, 1) }
  stepBack$$(index) { return this.move$$(index, -1) }
  compareTo$$(index, otherCursor) {
    if (index < otherCursor.index$) return -1
    if (index > otherCursor.index$) return 1
    return 0
  }
  equals$$(index, otherCursor) { return index === otherCursor.index$ }
  subtract$$(index, otherCursor) { return index - otherCursor.index$ }
  move$$(index, offset) { return index + offset }
  at$$(index, offset) { return this.at$[index + offset] }
  setAt$$(value, index, offset) { this.setAt$[index + offset] = value }

  // cursor proxy
  move$(index, offset) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBoundsOrEnd$(index, offset)) return false
    return this.move$$(index, offset)
  }
  compareTo$(index, otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) this.throwUnequatable$()
    return this.compareTo$$(index, otherCursor)
  }
  equals$(index, otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) this.throwUnequatable$()
    return this.equals$$(index, otherCursor)
  }
  at$(index, offset) { 
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBounds$(index, offset)) return
    return this.at$$(index, offset)
  }
  setAt$(index, offset, value) { 
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBounds$(index, offset)) this.throwWriteOutOfBounds$()
    this.setAt$$(index, offset, value)
    return true
  }
  subtract$(index, otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) this.throwUnequatable$()
    return this.subtract$$(index, otherCursor)
  }

  // container implementation
  get front$() { return this.at(0) }
  get back$() { return this.at(this.count - 1) }

  begin$(recyclable) { return this.cursor$(recyclable, 0) }
  end$(recyclable) { return this.cursor$(recyclable, this.count) }

  // shifting invalidates cursors
  shift() {
    const result = this.shift$()
    this.__bumpVersion$()
    return result
  }
  unshift(value) {
    this.unshift$(value)
    this.__bumpVersion$()
  }    

  at(index) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBounds$(index)) return
    return this.at$(index)
  }
  setAt(index, value) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBounds$(index)) this.throwWriteOutOfBounds$()
    this.setAt$(index, value)
    return true
  }
}
