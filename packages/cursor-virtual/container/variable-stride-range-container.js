import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { genericType } from '@kingjs/generic'
import {
  ProjectedRangeContainerOf,
} from './projected-range-container.js'
import { synchronize } from '../algorithms/synchronize.js'
import {
  VariableStrideRangeCursorOf,
} from '../cursor/variable-stride-range-cursor.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'

export const VariableStrideRangeContainerOf = genericType(TSpan => {
  const ProjectedRangeContainer = ProjectedRangeContainerOf(TSpan)
  const VariableStrideRangeCursor = VariableStrideRangeCursorOf(TSpan)

  return class VariableStrideRangeContainer extends ProjectedRangeContainer {
    static cursorType = VariableStrideRangeCursor

    _isContinuation
    _continuationCountOf

    constructor(source, {
      isContinuation,
      continuationCountOf,
    }) {
      super(source)
      this._isContinuation = isContinuation
      this._continuationCountOf = continuationCountOf
    }

    static {
      compose(this, TrimmedRangePart, {
        get sourceEnd$() {
          return synchronize(
            this.source$,
            this.source$.end(),
            {
              isContinuation: this._isContinuation,
              continuationCountOf: this._continuationCountOf,
            }
          )
        },
      })

      define(this, {
        tokenStrideOf$(value) {
          assert(!this._isContinuation(value),
            'Invalid continuation value.')

          return 1 + this._continuationCountOf(value)
        },
      })
    }
  }
})

export const VariableStrideRangeContainer =
  VariableStrideRangeContainerOf(Object)
