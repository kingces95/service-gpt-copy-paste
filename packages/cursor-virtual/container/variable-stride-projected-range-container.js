import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { RangePart } from '@kingjs/cursor'
import { ProjectedRangeContainer } from './projected-range-container.js'
import { synchronize } from '../algorithms/synchronize.js'
import { VariableStrideProjectedCursor } from '../cursor/variable-stride-projected-cursor.js'
import { VariableStrideProjector } from '../projector/variable-stride-projector.js'

export class VariableStrideProjectedRangeContainer extends ProjectedRangeContainer {
  static cursorType = VariableStrideProjectedCursor

  _isContinuation
  _continuationCountOf

  constructor(source, {
    isContinuation,
    continuationCountOf,
  }) {
    super(source)
    this._isContinuation = isContinuation
    this._continuationCountOf = continuationCountOf
    this._projector = new VariableStrideProjector(this, { isContinuation })
  }

  static {
    compose(this, RangePart, {
      end() {
        return new this.cursorType(
          this,
          synchronize(
            this.source$,
            this.source$.end(),
            {
              isContinuation: this._isContinuation,
              continuationCountOf: this._continuationCountOf,
            }
          )
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
