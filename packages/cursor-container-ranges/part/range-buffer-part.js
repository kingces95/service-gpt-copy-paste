import { assert } from '@kingjs/assert'
import { CursorConcept, RangeConcept } from '@kingjs/cursor'
import { BidirectionalRangeShape } from '@kingjs/cursor-shape'
import { defaultTo } from '@kingjs/function-contract'
import { DefinesAbstract } from '@kingjs/partial-class'
import { PartialClass } from '@kingjs/partial-class'
import { implement } from '@kingjs/partial-implement'
import { members } from '@kingjs/partial-signature'

function cursorBelongsToThisRange(cursor) {
  assert(cursor.range == this,
    'Range buffer cursor must belong to this container.')
}

export class RangeBufferPart extends PartialClass {
  static [DefinesAbstract] = members(this, {
    pushRange: {
      types: [BidirectionalRangeShape],
      method(range) { },
    },

    popRange: {
      types: [CursorConcept],
      defaults: [defaultTo(({ self }) => self.end())],
      precondition: cursorBelongsToThisRange,
      method(cursor /* = this.end() */) { },
    },
  })

  static {
    implement(this, RangeConcept, { }, {
      begin() { },
      end() { },
    })
  }
}
