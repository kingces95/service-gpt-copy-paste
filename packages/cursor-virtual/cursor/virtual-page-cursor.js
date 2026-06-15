import { advance } from '@kingjs/cursor-algorithm'
import { define } from '@kingjs/partial-define'
import { PageCursor } from './page-cursor.js'

export class VirtualPageCursor extends PageCursor {
  static {
    define(this, {
      virtualize() {
        if (this.equals(this.container.end()))
          return this.container._virtualEnd.clone()

        const result = this.container._virtualBegin.clone()
        advance(result.sourceCursor$, this.offset$)
        return result
      },
    })
  }
}
