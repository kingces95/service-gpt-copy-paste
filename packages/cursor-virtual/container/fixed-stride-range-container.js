import { compose } from '@kingjs/partial-compose'
import { assert } from '@kingjs/assert'
import { genericType } from '@kingjs/generic'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import {
  ProjectedRangeContainerOf,
} from './projected-range-container.js'
import { RangeOfRangesShapeOf } from '../shape/range-of-ranges-shape.js'
import { distance, previous } from '@kingjs/cursor-algorithm'
import {
  FixedStrideRangeCursorOf,
} from '../cursor/fixed-stride-range-cursor.js'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { RangeOfRangesPartOf } from '../part/range-of-ranges-part.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'

export const FixedStrideRangeContainerOf = genericType(TSpan => {
  const ProjectedRangeContainer = ProjectedRangeContainerOf(TSpan)
  const RangeOfRangesPart = RangeOfRangesPartOf(TSpan)
  const RangeOfRangesShape = RangeOfRangesShapeOf(TSpan)
  const pushRange = ProjectedRangeContainer.prototype.pushRange
  const FixedStrideRangeCursor = FixedStrideRangeCursorOf(TSpan)

  return class FixedStrideRangeContainer extends ProjectedRangeContainer {
    static cursorType = FixedStrideRangeCursor

    _remainder
    _strideLength

    constructor(source, { strideLength = 1 } = { }) {
      super(source)
      assert(source instanceof RangeOfRangesShape &&
        source instanceof BidirectionalRangeShape,
        'Fixed projected range source must be a bidirectional range of ranges.')
      this._remainder = 0
      this._strideLength = strideLength
    }

    static {
      compose(this, ProjectedRangePart, {
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

export const FixedStrideRangeContainer = FixedStrideRangeContainerOf(Object)
