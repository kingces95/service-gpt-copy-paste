import { define } from '@kingjs/partial-define'
import { ProjectedRangeCursor } from './projected-range-cursor.js'

export class VariableStrideRangeCursor extends ProjectedRangeCursor {
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
