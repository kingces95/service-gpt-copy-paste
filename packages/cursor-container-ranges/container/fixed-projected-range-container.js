import { define } from '@kingjs/partial-define'
import { assert } from '@kingjs/assert'
import {
  BidirectionalRangeShape,
  SizedContainerShape,
} from '@kingjs/cursor-shape'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { RangeBufferShape } from '../shape/range-buffer-shape.js'
import { previous } from '@kingjs/cursor-algorithm'
import {
  FixedProjectedRangeCursor,
} from '../cursor/fixed-projected-range-cursor.js'

export class FixedProjectedRangeContainer extends ProjectedRangeContainer {
  static cursorType = FixedProjectedRangeCursor

  _fixedStride

  constructor(source, { fixedStride = 1 } = { }) {
    super(source)
    assert(source instanceof RangeBufferShape &&
      source instanceof SizedContainerShape &&
      source instanceof BidirectionalRangeShape,
      'Fixed projected range source must be a sized bidirectional range buffer.')
    this._fixedStride = fixedStride
  }

  static {
    define(this, {
      get sourceEnd$() {
        const sourceSize = this.source.size
        return previous(
          this.source.end(),
          sourceSize % this._fixedStride
        )
      },

      get size() {
        const sourceSize = this.source.size
        const completeSize = sourceSize - sourceSize % this._fixedStride
        return completeSize / this._fixedStride
      },
    })
  }
}
