import { define } from '@kingjs/partial-define'
import { VirtualCursor } from './virtual-cursor.js'
import { subrange } from '@kingjs/cursor-view'
import {
  VariableStridePageContainer,
} from '../container/variable-stride-page-container.js'

const pages = VirtualCursor.prototype.pages

export class VariableStrideVirtualCursor extends VirtualCursor {
  static {
    define(this, {
      get stride$() {
        if (this.sourceCursor$.equals(this.container.source$.end()))
          return null

        return this.container.tokenStrideOf$(this.sourceCursor$.value)
      },

      *pages(other) {
        for (const descriptor of pages.call(this, other)) {
          const { begin, end } = descriptor
          const page = new VariableStridePageContainer(
            descriptor.page ?? subrange(begin, end),
            {
              isContinuation: value =>
                this.container._isContinuation(value),
              virtualizeOffset: offset => descriptor.virtualize(offset),
            }
          )

          yield {
            page,
            begin: page.begin(),
            end: page.end(),
            cursorAt: offset => page.cursorAt(offset).virtualize(),
            isSynchronized: offset => page.cursorAt(offset)
              .isSynchronized(),
            virtualize: offset => page.cursorAt(offset).virtualize(),
          }
        }
      },
    })
  }
}
