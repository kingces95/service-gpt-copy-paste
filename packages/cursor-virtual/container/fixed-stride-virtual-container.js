import { compose } from '@kingjs/partial-compose'
import { assert } from '@kingjs/assert'
import { genericType } from '@kingjs/generic'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import {
  VirtualContainerOf,
} from './virtual-container.js'
import { RangeOfRangesShapeOf } from '../shape/range-of-ranges-shape.js'
import { distance, previous } from '@kingjs/cursor-algorithm'
import {
  FixedStrideVirtualCursorOf,
} from '../cursor/fixed-stride-virtual-cursor.js'
import { VirtualPart } from '../part/virtual-part.js'
import { RangeOfRangesPartOf } from '../part/range-of-ranges-part.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'

export const FixedStrideVirtualContainerOf = genericType(TSpan => {
  const VirtualContainer = VirtualContainerOf(TSpan)
  const RangeOfRangesPart = RangeOfRangesPartOf(TSpan)
  const RangeOfRangesShape = RangeOfRangesShapeOf(TSpan)
  const pushRange = VirtualContainer.prototype.pushRange
  const FixedStrideVirtualCursor = FixedStrideVirtualCursorOf(TSpan)

  return class FixedStrideVirtualContainer extends VirtualContainer {
    static cursorType = FixedStrideVirtualCursor

    _remainder
    _strideLength

    constructor(source, { strideLength = 1 } = { }) {
      super(source)
      assert(source instanceof RangeOfRangesShape &&
        source instanceof BidirectionalRangeShape,
        'Fixed virtual source must be a bidirectional range of ranges.')
      this._remainder = 0
      this._strideLength = strideLength
    }

    static {
      compose(this, VirtualPart, {
        decodeToken$(sourceCursor, stride) {
          assert(stride == 1,
            'Fixed stride range default decode requires stride one.')
          return sourceCursor.value
        },
      })

      compose(this, RangeOfRangesPart, {
        pushRange(range) {
          pushRange.call(this, range)
          this._remainder =
            (this._remainder + distance(range)) % this._strideLength

          return this
        },
      })

      compose(this, TrimmedRangePart, {
        get sourceEnd$() {
          return previous(this.source$.end(), this._remainder)
        },
      })
    }
  }
})

export const FixedStrideVirtualContainer = FixedStrideVirtualContainerOf(Object)
