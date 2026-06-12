import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { distance, previous } from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'
import { genericType } from '@kingjs/generic'
import { VirtualCursorOf } from './virtual-cursor.js'
import {
  FixedStridePageContainer,
} from '../container/fixed-stride-page-container.js'

export const FixedStrideVirtualCursorOf = genericType(TSpan => {
  const VirtualCursor = VirtualCursorOf(TSpan)
  const pages = VirtualCursor.prototype.pages

  return class FixedStrideVirtualCursor extends VirtualCursor {
    static {
      define(this, {
        get stride$() { return this.container._strideLength },
      })

      compose(this, BacktrackableCursorPart, {
        isAtBegin$() {
          return this.sourceCursor$.equals(this.container.source$.begin())
        },

        stepBack() {
          this._sourceCursor = previous(
            this.sourceCursor$,
            this.container._strideLength
          )
          return this
        },
      })

      define(this, {
        *pages(other) {
          let modulus = 0

          for (const descriptor of pages.call(this, other)) {
            const { begin, end } = descriptor
            const pageModulus = modulus
            const page = new FixedStridePageContainer(
              subrange(begin, end),
              {
                modulus: pageModulus,
                strideLength: this.container._strideLength,
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

            modulus = (modulus + distance(subrange(begin, end))) %
              this.container._strideLength
          }
        },
      })
    }
  }
})

export const FixedStrideVirtualCursor = FixedStrideVirtualCursorOf(Object)
