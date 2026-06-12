import { define } from '@kingjs/partial-define'
import { genericType } from '@kingjs/generic'
import { VirtualCursorOf } from './virtual-cursor.js'
import { subrange } from '@kingjs/cursor-view'
import {
  VariableStridePageContainer,
} from '../container/variable-stride-page-container.js'

export const VariableStrideVirtualCursorOf = genericType(TSpan => {
  const VirtualCursor = VirtualCursorOf(TSpan)
  const pages = VirtualCursor.prototype.pages

  return class VariableStrideVirtualCursor extends VirtualCursor {
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
              subrange(begin, end),
              {
                isContinuation: value =>
                  this.container._isContinuation(value),
                virtualizeOffset: offset => descriptor.virtualize(offset),
              }
            )

            yield {
              begin,
              end,
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
})

export const VariableStrideVirtualCursor = VariableStrideVirtualCursorOf(Object)
