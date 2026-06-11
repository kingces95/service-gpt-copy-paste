import { assert } from '@kingjs/assert'
import { CursorConcept } from '@kingjs/cursor'
import { BidirectionalRangeShape } from '@kingjs/cursor-shape'
import { ContainerPart } from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import { genericType } from '@kingjs/generic'
import { iterate } from '@kingjs/cursor-algorithm'
import { spansOfRange } from '@kingjs/cursor-shape'
import {
  Defines,
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

function assertSpanType(range, span) {
  assert(span instanceof range.constructor.spanType,
    'Range span type must match spanType.')
}

function cursorAtOffset(range, offset) {
  const cursor = range.begin()

  for (let i = 0; i < offset; i++)
    cursor.step()

  return cursor
}

export const RangeOfRangesPartOf = genericType(TSpan => {
  return class RangeOfRangesPart extends ContainerPart {
    static spanType = TSpan

    static [DefinesAbstract] = members(this, {
      pushRange: {
        types: [BidirectionalRangeShape],
        method(range) { },
      },

      popRange: {
        types: [CursorConcept],
        defaults: [defaultTo(({ self }) => self.end())],
        precondition(cursor) {
          this.ownCursorAssert$(cursor)
        },
        method(cursor /* = this.end() */) { },
      },

      ranges() { },
    })

    static [Defines] = {
      pages() {
        return this.begin().pages(this.end())
      },

      *spans() {
        let baseOffset = 0
        const range = this

        for (const childRange of iterate(this.ranges())) {
          for (const descriptor of spansOfRange(childRange)) {
            const { span } = descriptor
            const currentOffset = baseOffset

            assertSpanType(this, span)
            yield {
              span,
              cursorAt(offset) {
                return cursorAtOffset(range, currentOffset + offset)
              },
            }

            baseOffset += span.length
          }
        }
      },
    }
  }
})

export const RangeOfRangesPart = RangeOfRangesPartOf(Object)
