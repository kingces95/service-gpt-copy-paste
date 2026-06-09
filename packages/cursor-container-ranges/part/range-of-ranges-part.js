import { assert } from '@kingjs/assert'
import { CursorConcept } from '@kingjs/cursor'
import { BidirectionalRangeShape } from '@kingjs/cursor-shape'
import { ContainerPart } from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import { genericType } from '@kingjs/generic'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  Defines,
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

function assertSpanType(range, span) {
  assert(span instanceof range.constructor.spanType,
    'Range span type must match spanType.')
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
      *spans() {
        for (const range of iterate(this.ranges())) {
          if (typeof range.spans == 'function') {
            for (const span of range.spans()) {
              assertSpanType(this, span)
              yield span
            }
            continue
          }

          assert(typeof range.span == 'function',
            'Range must expose span().')
          const span = range.span()

          assertSpanType(this, span)
          yield span
        }
      },
    }
  }
})

export const RangeOfRangesPart = RangeOfRangesPartOf(Object)
