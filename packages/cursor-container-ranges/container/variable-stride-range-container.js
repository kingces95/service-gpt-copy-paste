import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { synchronize } from '../algorithms/synchronize.js'
import {
  VariableStrideRangeCursor,
} from '../cursor/variable-stride-range-cursor.js'

export class VariableStrideRangeContainer extends ProjectedRangeContainer {
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
    define(this, {
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

      tokenStrideOf$(value) {
        assert(!this._isContinuation(value),
          'Invalid continuation value.')

        return 1 + this._continuationCountOf(value)
      },
    })
  }
}
