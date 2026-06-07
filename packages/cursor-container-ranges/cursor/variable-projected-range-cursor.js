import { compose } from '@kingjs/partial-compose'
import {
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { advance } from '@kingjs/cursor-algorithm'
import { ProjectedRangeCursor } from './projected-range-cursor.js'

export class VariableProjectedRangeCursor extends ProjectedRangeCursor {
  static {
    compose(this, CursorPart, {
      get isAtEnd$() {
        return this.sourceCursor.equals(this.container.sourceEnd$)
      },
    })

    compose(this, SteppableCursorPart, {
      step() {
        advance(this.sourceCursor, this.container.decodeStride$(
          this.sourceCursor
        ))
        this.current = undefined
        return this
      },
    })

    compose(this, ReadableCursorPart, {
      get value() { return this.current },
    })
  }
}
