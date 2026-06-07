import { assert } from '@kingjs/assert'
import { CursorConcept, RangeConcept } from '@kingjs/cursor'
import { BidirectionalRangeShape } from '@kingjs/cursor-shape'
import { defaultTo } from '@kingjs/function-contract'
import { DefinesAbstract } from '@kingjs/partial-class'
import { PartialClass } from '@kingjs/partial-class'
import { implement } from '@kingjs/partial-implement'
import {
  ArgChecks,
  Defaults,
  Preconditions,
} from '@kingjs/partial-proxy'

function cursorBelongsToThisRange(cursor) {
  assert(cursor.range == this,
    'Range buffer cursor must belong to this container.')
}

export class RangeBufferPart extends PartialClass {
  static [ArgChecks] = {
    pushRange: [BidirectionalRangeShape],
    popRange: [CursorConcept],
  }

  static [Defaults] = {
    popRange: [
      defaultTo(({ self }) => self.end()),
    ],
  }

  static [Preconditions] = {
    popRange: cursorBelongsToThisRange,
  }

  static [DefinesAbstract] = {
    pushRange(range) { },
    popRange(cursor /* = this.end() */) { },
  }

  static {
    implement(this, RangeConcept, { }, {
      begin() { },
      end() { },
    })
  }
}
