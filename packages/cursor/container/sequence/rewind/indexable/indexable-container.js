import { RewindContainer } from '../rewind-container.js'
import { IndexableCursor } from './indexable-cursor.js'
import {
  throwNotImplemented,
  throwUnequatable,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
} from '../../../../throw.js'

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

  // indexable cursor implementation
  at$$$(index, offset) { throwNotImplemented() }
  setAt$$$(value, index, offset) { throwNotImplemented() }

  // cursor implementation
  value$$(index) { return this.at$$(index, 0) }
  step$$(index) { return this.move$$(index, 1) }
  stepBack$$(index) { return this.move$$(index, -1) }
  move$$(index, offset) { 
    if (!this.isInBoundsOrEnd$(index, offset)) throwMoveOutOfBounds()
    return index + offset 
  }
  compareTo$$(index, otherCursor) {
    if (index < otherCursor.index$) return -1
    if (index > otherCursor.index$) return 1
    return 0
  }
  equals$$(index, otherCursor) { return index === otherCursor.index$ }
  subtract$$(index, otherCursor) { return index - otherCursor.index$ }

  // indexable cursor proxy
  at$$(index, offset) { 
    if (!this.isInBounds$(index, offset)) return
    return this.at$$$(index, offset)
  }
  setAt$$(value, index, offset) { 
    if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    this.setAt$$$(value, index, offset)
  }

  // cursor proxy
  move$(index, offset) {
    if (this.isDisposed) this.throwDisposed$()
    return this.move$$(index, offset)
  }
  compareTo$(index, otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) throwUnequatable()
    return this.compareTo$$(index, otherCursor)
  }
  equals$(index, otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) throwUnequatable()
    return this.equals$$(index, otherCursor)
  }
  at$(index, offset) { 
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBounds$(index, offset)) return
    return this.at$$(index, offset)
  }
  setAt$(index, offset, value) { 
    if (this.isDisposed) this.throwDisposed$()
    if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    this.setAt$$(index, offset, value)
    return true
  }
  subtract$(index, otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) throwUnequatable()
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
    return this.at$(index)
  }
  setAt(index, value) {
    if (this.isDisposed) this.throwDisposed$()
    this.setAt$(index, value)
    return true
  }
}
