import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { synchronize } from '../algorithms/synchronize.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'
import {
  VariableProjectedRangeCursor,
} from '../cursor/variable-projected-range-cursor.js'

export class VariableProjectedRangeContainer extends ProjectedRangeContainer {
  static cursorType = VariableProjectedRangeCursor

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
          this.source,
          this.source.end(),
          {
            isContinuation: this._isContinuation,
            continuationCountOf: this._continuationCountOf,
          }
        )
      },
    })

    define(this, {
      decodeStride$(sourceCursor) {
        if (sourceCursor.equals(this.source.end()))
          return null

        assert(!this._isContinuation(sourceCursor.value),
          'Invalid continuation value.')

        return 1 + this._continuationCountOf(sourceCursor.value)
      },
    })
  }
}
