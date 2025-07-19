import { RewindContainer } from '../rewind-container.js'
import { IndexableCursor } from './indexable-cursor.js'
import {
  throwNotImplemented,
  throwNotEquatableTo,
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
  at$$$(index) { throwNotImplemented() }
  setAt$$$(index, value) { throwNotImplemented() }

  // cursor implementation
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

  // input cursor concept implementation
  value$$(index) { return this.at$$(index, 0) }

  // output cursor concept implementation
  setValue$$(index, value) {
    this.setAt$$(index, 0, value)
    return true
  }

  // random access cursor concept implementation
  at$$(index, offset) { 
    if (!this.isInBounds$(index, offset)) return
    return this.at$$$(index + offset)
  }
  setAt$$(index, offset, value) { 
    if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    this.setAt$$$(index + offset, value)
  }

  // cursor proxy
  move$(index, offset) {
    return this.move$$(index, offset)
  }
  compareTo$(index, otherCursor) {
    if (!this.equatableTo$(otherCursor)) throwNotEquatableTo()
    return this.compareTo$$(index, otherCursor)
  }
  equals$(index, otherCursor) {
    if (!this.equatableTo$(otherCursor)) throwNotEquatableTo()
    return this.equals$$(index, otherCursor)
  }
  at$(index, offset) { 
    if (!this.isInBounds$(index, offset)) return
    return this.at$$(index, offset)
  }
  setAt$(index, offset, value) { 
    if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    this.setAt$$(index, offset, value)
    return true
  }
  subtract$(index, otherCursor) {
    if (!this.equatableTo$(otherCursor)) throwNotEquatableTo()
    return this.subtract$$(index, otherCursor)
  }

  // container implementation
  get front$() { return this.at$(0, 0) }
  get back$() { return this.at$(this.count - 1, 0) }

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

  at(index) { return this.at$(index, 0) }
  setAt(index, value) {
    this.setAt$(index, 0, value)
    return true
  }
}
