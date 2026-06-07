import { compose } from '@kingjs/partial-compose'
import {
  BacktrackableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import {
  advance,
  previous,
} from '@kingjs/cursor-algorithm'
import { ProjectedRangeCursor } from './projected-range-cursor.js'

export class FixedProjectedRangeCursor extends ProjectedRangeCursor {
  static {
    compose(this, CursorPart, {
      get isAtEnd$() {
        return this.sourceCursor.equals(this.container.sourceEnd$)
      },
    })

    compose(this, SteppableCursorPart, {
      step() {
        advance(this.sourceCursor, this.container._fixedStride)
        this.current = undefined
        return this
      },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() {
        return this.sourceCursor.equals(this.container.source.begin())
      },

      stepBack() {
        this.sourceCursor = previous(
          this.sourceCursor,
          this.container._fixedStride
        )
        this.current = undefined
        return this
      },
    })

    compose(this, ReadableCursorPart, {
      get value() { return this.current },
    })
  }
}
