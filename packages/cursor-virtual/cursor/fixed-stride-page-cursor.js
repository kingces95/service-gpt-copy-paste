import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { advance, previous } from '@kingjs/cursor-algorithm'
import { PageCursor } from './page-cursor.js'

function cursorAt(page, offset) {
  const cursor = page.begin()
  advance(cursor, offset)
  return cursor
}

export class FixedStridePageCursor extends PageCursor {
  static {
    define(this, {
      isSynchronized() {
        return (this.container._modulus + this.offset$) %
          this.container._strideLength == 0
      },

      synchronize() {
        const remainder = (this.container._modulus + this.offset$) %
          this.container._strideLength

        if (!remainder)
          return this.clone()

        if (remainder > this.offset$)
          return null

        return new this.constructor(
          this.container,
          previous(this.sourceCursor$, remainder)
        )
      },

      virtualize() {
        if (!this.isSynchronized())
          return null

        return cursorAt(this.container._sourcePage, this.offset$)
          .virtualize()
      },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() {
        return this.sourceCursor$.equals(this.container._range.begin())
      },

      stepBack() {
        this._sourceCursor = previous(this.sourceCursor$)
        return this
      },
    })
  }
}
