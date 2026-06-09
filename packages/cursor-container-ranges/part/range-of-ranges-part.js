import { assert } from '@kingjs/assert'
import { CursorConcept } from '@kingjs/cursor'
import { BidirectionalRangeShape } from '@kingjs/cursor-shape'
import { ContainerPart } from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  Defines,
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class RangeOfRangesPart extends ContainerPart {
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
          yield* range.spans()
          continue
        }

        assert(typeof range.span == 'function',
          'Range must expose span().')
        yield range.span()
      }
    },
  }
}
