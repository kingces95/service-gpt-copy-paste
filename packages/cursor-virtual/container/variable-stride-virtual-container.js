import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { genericType } from '@kingjs/generic'
import {
  VirtualContainerOf,
} from './virtual-container.js'
import { synchronize } from '../algorithms/synchronize.js'
import {
  VariableStrideVirtualCursorOf,
} from '../cursor/variable-stride-virtual-cursor.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'

export const VariableStrideVirtualContainerOf = genericType(TSpan => {
  const VirtualContainer = VirtualContainerOf(TSpan)
  const VariableStrideVirtualCursor = VariableStrideVirtualCursorOf(TSpan)

  return class VariableStrideVirtualContainer extends VirtualContainer {
    static cursorType = VariableStrideVirtualCursor

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

export const VariableStrideVirtualContainer =
  VariableStrideVirtualContainerOf(Object)
