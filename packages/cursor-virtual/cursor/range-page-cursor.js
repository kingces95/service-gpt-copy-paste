import { define } from '@kingjs/partial-define'
import { PageCursor } from './page-cursor.js'

export class RangePageCursor extends PageCursor {
  static {
    define(this, {
      virtualize() {
        if (this.sourceCursor$.equals(this.container._innerCursorEnd))
          return this.container._virtualEnd.clone()

        return new this.container._container.cursorType(
          this.container._container,
          this.container._outerCursor.clone(),
          this.sourceCursor$.clone(),
          this.container._innerCursorEnd.clone()
        )
      },
    })
  }
}
