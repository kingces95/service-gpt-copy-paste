import { define } from '@kingjs/partial-define'
import { genericType } from '@kingjs/generic'
import { ProjectedRangeCursorOf } from './projected-range-cursor.js'

export const VariableStrideRangeCursorOf = genericType(TSpan => {
  const ProjectedRangeCursor = ProjectedRangeCursorOf(TSpan)

  return class VariableStrideRangeCursor extends ProjectedRangeCursor {
    static {
      define(this, {
        get stride$() {
          if (this.sourceCursor$.equals(this.container.source$.end()))
            return null

          return this.container.tokenStrideOf$(this.sourceCursor$.value)
        },
      })
    }
  }
})

export const VariableStrideRangeCursor = VariableStrideRangeCursorOf(Object)
