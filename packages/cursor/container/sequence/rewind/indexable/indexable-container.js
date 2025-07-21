import { RewindContainer } from '../rewind-container.js'
import { IndexableCursor } from './indexable-cursor.js'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotImplemented,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
} from '../../../../throw.js'

export class IndexableContainer extends RewindContainer {
  static [Preconditions] = class extends RewindContainer[Preconditions] {
    subtract$(index, otherCursor) {
      if (!this.equatableTo$(otherCursor)) throwNotEquatableTo()
    }
    move$(index, offset) {
      if (!this.isInBoundsOrEnd$(index, offset)) throwMoveOutOfBounds()
    }
    compareTo$(index, other) {
      if (!this.equatableTo$(other)) throwNotEquatableTo()
    }
    at$(index, offset) {
      if (!this.isInBounds$(index, offset)) throwReadOutOfBounds()
    }
    setAt$(index, offset, value) {
      if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    }

    shift() {
      super.shift()
      this.__bumpVersion$()
    }
    unshift(value) {
      this.__bumpVersion$()
    }
  }

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

  // basic cursor
  equals$(index, otherCursor) { return index === otherCursor.index$ }

  // step cursor
  step$(index) { return this.move$(index, 1) }

  // input cursor
  value$(index) { return this.at$(index, 0) }

  // output cursor
  setValue$(index, value) {
    this.setAt$(index, 0, value)
  }

  // rewind cursor
  stepBack$(index) { return this.move$(index, -1) }

  // random access cursor
  subtract$(index, otherCursor) { return index - otherCursor.index$ }
  move$(index, offset) { return index + offset }
  compareTo$(index, otherCursor) {
    if (index < otherCursor.index$) return -1
    if (index > otherCursor.index$) return 1
    return 0
  }
  at$(index, offset) { throwNotImplemented() }
  setAt$(index, offset, value) { throwNotImplemented() }

  // cursor factor
  begin(recyclable) { return this.cursor$(recyclable, 0) }
  end(recyclable) { return this.cursor$(recyclable, this.count) }

  // sequence container
  get front() { return this.at$(0, 0) }
  shift() { throwNotImplemented() }
  unshift(value) { throwNotImplemented() }

  // rewind container
  get back() { return this.at$(this.count - 1, 0) }

  // indexable container
  at(index) { return this.at$(index, 0) }
  setAt(index, value) { this.setAt$(index, 0, value) }
}
