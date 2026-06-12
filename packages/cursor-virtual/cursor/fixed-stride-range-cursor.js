import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { distance, previous } from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'
import { genericType } from '@kingjs/generic'
import { ProjectedRangeCursorOf } from './projected-range-cursor.js'

export const FixedStrideRangeCursorOf = genericType(TSpan => {
  const ProjectedRangeCursor = ProjectedRangeCursorOf(TSpan)
  const pages = ProjectedRangeCursor.prototype.pages

  return class FixedStrideRangeCursor extends ProjectedRangeCursor {
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
            const { begin, end, cursorAt } = descriptor
            const pageModulus = modulus

            yield {
              begin,
              end,
              cursorAt: offset => {
                if ((pageModulus + offset) % this.container._strideLength)
                  return null

                return cursorAt(offset)
              },
            }

            modulus = (modulus + distance(subrange(begin, end))) %
              this.container._strideLength
          }
        },
      })
    }
  }
})

export const FixedStrideRangeCursor = FixedStrideRangeCursorOf(Object)
