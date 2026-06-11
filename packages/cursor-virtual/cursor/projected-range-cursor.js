import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { define, defineAbstract } from '@kingjs/partial-define'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { advance } from '@kingjs/cursor-algorithm'
import { ContainerCursor } from '@kingjs/cursor-container'

export class ProjectedRangeCursor extends ContainerCursor {
  _sourceCursor

  constructor(container, sourceCursor) {
    super(container)
    this._sourceCursor = sourceCursor
  }

  static {
    defineAbstract(this, {
      get stride$() { },
      get sourceCursor$() { },
    })

    define(this, {
      get sourceCursor$() { return this._sourceCursor },
    })

    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.sourceCursor$.equals(other.sourceCursor$)
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

    compose(this, CursorPart, {
      get isAtEnd$() {
        return this.sourceCursor$.equals(this.container.sourceEnd$)
      },
    })

    compose(this, SteppableCursorPart, {
      step() {
        advance(this.sourceCursor$, this.stride$)
        return this
      },
    })

    compose(this, ReadableCursorPart, {
      get value() {
        return this.container.decodeToken$(
          this.sourceCursor$.clone(),
          this.stride$
        )
      },
    })
  }
}
