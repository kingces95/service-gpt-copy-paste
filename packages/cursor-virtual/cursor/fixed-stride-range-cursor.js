import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { previous } from '@kingjs/cursor-algorithm'
import { genericType } from '@kingjs/generic'
import { ProjectedRangeCursorOf } from './projected-range-cursor.js'

export const FixedStrideRangeCursorOf = genericType(TSpan => {
  const ProjectedRangeCursor = ProjectedRangeCursorOf(TSpan)

  return class FixedStrideRangeCursor extends ProjectedRangeCursor {
    static {
      define(this, {
        get stride$() { return this.container._strideLength },
      })

      compose(this, BacktrackableCursorPart, {
        isAtBegin$() {
          return this.sourceCursor$.equals(this.container.source$.begin())
        },

        stepBack() {
          this._sourceCursor = previous(
            this.sourceCursor$,
            this.container._strideLength
          )
          return this
        },
      })
    }
  }
})

export const FixedStrideRangeCursor = FixedStrideRangeCursorOf(Object)
