import { compose } from '@kingjs/partial-compose'
import { assert } from '@kingjs/assert'
import { RangePart } from '@kingjs/cursor'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { VirtualContainerShape } from '../shape/virtual-container-shape.js'
import { distance, previous } from '@kingjs/cursor-algorithm'
import { FixedStrideProjectedCursor } from '../cursor/fixed-stride-projected-cursor.js'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { VirtualContainerPart } from '../part/virtual-container-part.js'
import { FixedStrideProjector } from '../projector/fixed-stride-projector.js'

const pushRange = ProjectedRangeContainer.prototype.pushRange

export class FixedStrideProjectedRangeContainer extends ProjectedRangeContainer {
  static cursorType = FixedStrideProjectedCursor

  _remainder
  _strideLength

  constructor(source, { strideLength = 1 } = { }) {
    super(source)
    assert(source instanceof VirtualContainerShape &&
      source instanceof BidirectionalRangeShape,
      'Fixed virtual source must be a bidirectional range of ranges.')
    this._remainder = 0
    this._strideLength = strideLength
    this._projector = new FixedStrideProjector(this, { strideLength })
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor, stride) {
        assert(stride == 1,
          'Fixed stride range default decode requires stride one.')
        return sourceCursor.value
      },
    })

    compose(this, VirtualContainerPart, {
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
