import { compose } from '@kingjs/partial-compose'
import { assert } from '@kingjs/assert'
import { RangePart } from '@kingjs/cursor'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { SplittableRangeShape } from '../shape/ranges-container-shape.js'
import { distance, previous } from '@kingjs/cursor-algorithm'
import { FixedStrideProjectedCursor } from '../cursor/fixed-stride-projected-cursor.js'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { RangeContainerPart } from '../part/range-container-part.js'

const pushRange = ProjectedRangeContainer.prototype.pushRange

export class FixedStrideProjectedRangeContainer extends ProjectedRangeContainer {
  static cursorType = FixedStrideProjectedCursor

  _remainder
  _strideLength

  constructor(source, { strideLength = 1 } = { }) {
    super(source)
    assert(source instanceof SplittableRangeShape &&
      source instanceof BidirectionalRangeShape,
      'Fixed virtual source must be a bidirectional range of ranges.')
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

    compose(this, RangeContainerPart, {
      pushRange(range) {
        pushRange.call(this, range)
        this._remainder =
          (this._remainder + distance(range)) % this._strideLength

        return this
      },
    })

    compose(this, RangePart, {
      end() {
        return new this.cursorType(
          this,
          previous(this.source$.end(), this._remainder)
        )
      },
    })
  }
}
