import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  CloneableCursorPart,
  BacktrackableCursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { ContainerCursor } from '@kingjs/cursor-container'

export class ProjectedCursor extends ContainerCursor {
  _sourceCursor

  constructor(container, sourceCursor) {
    super(container)
    this._sourceCursor = sourceCursor
  }

  static {
    define(this, {
      get sourceCursor$() { return this._sourceCursor },
    })

    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.sourceCursor$.equals(other.sourceCursor$)
      },
    })

    compose(this, SteppableCursorPart, {
      step() {
        this.container.stepValue$(this.sourceCursor$)
        return this
      },
    })

    compose(this, BacktrackableCursorPart, {
      stepBack() {
        this.container.stepBackValue$(this.sourceCursor$)
        return this
      },
    })

    compose(this, CloneableCursorPart, {
      clone() {
        return new this.constructor(
          this.container,
          this.sourceCursor$.clone()
        )
      },
    })

    compose(this, ReadableCursorPart, {
      get value() {
        return this.container.decodeValue$(this.sourceCursor$.clone())
      },
    })
  }
}
