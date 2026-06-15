import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { advance } from '@kingjs/cursor-algorithm'
import { PageCursor } from './page-cursor.js'

function cursorAt(page, offset) {
  const cursor = page.begin()
  advance(cursor, offset)
  return cursor
}

export class VariableStridePageCursor extends PageCursor {
  static {
    define(this, {
      isSynchronized() {
        if (this.isAtEnd$)
          return true

        return !this.container._isContinuation(this.value)
      },

      synchronize() {
        const cursor = this.clone()

        while (!cursor.isSynchronized()) {
          if (cursor.isAtBegin$())
            return null

          cursor.stepBack()
        }

        return cursor
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
        this.sourceCursor$.stepBack()
        return this
      },
    })
  }
}
