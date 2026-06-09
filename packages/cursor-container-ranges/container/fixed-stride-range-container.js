import { define } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import { assert } from '@kingjs/assert'
import {
  BidirectionalRangeShape,
  SizedContainerShape,
} from '@kingjs/cursor-shape'
import {
  SizedContainerPart,
} from '@kingjs/cursor-container'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { RangeBufferShape } from '../shape/range-buffer-shape.js'
import { previous } from '@kingjs/cursor-algorithm'
import {
  FixedStrideRangeCursor,
} from '../cursor/fixed-stride-range-cursor.js'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'

export class FixedStrideRangeContainer extends ProjectedRangeContainer {
  static cursorType = FixedStrideRangeCursor

  _strideLength

  constructor(source, { strideLength = 1 } = { }) {
    super(source)
    assert(source instanceof RangeBufferShape &&
      source instanceof SizedContainerShape &&
      source instanceof BidirectionalRangeShape,
      'Fixed projected range source must be a sized bidirectional range buffer.')
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

    compose(this, TrimmedRangePart, {
      get sourceEnd$() {
        const sourceSize = this.source$.size
        return previous(
          this.source$.end(),
          sourceSize % this._strideLength
        )
      },
    })

    compose(this, SizedContainerPart, {
      get size() {
        const sourceSize = this.source$.size
        const completeSize = sourceSize - sourceSize % this._strideLength
        return completeSize / this._strideLength
      },
    })
  }
}
