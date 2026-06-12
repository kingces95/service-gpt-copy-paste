import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  BacktrackableCursorPart,
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SpannableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { ContainerCursor } from '@kingjs/cursor-container'
import { distance } from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'

export class PageCursor extends ContainerCursor {
  _sourceCursor

  constructor(container, sourceCursor) {
    super(container)
    this._sourceCursor = sourceCursor
  }

  static {
    define(this, {
      get sourceCursor$() { return this._sourceCursor },

      get offset$() {
        return distance(subrange(this.container._range.begin(),
          this.sourceCursor$))
      },

      isSynchronized() {
        return true
      },

      synchronize() {
        return this.clone()
      },

      virtualize() {
        return this.container.virtualizeOffset(this.offset$)
      },
    })

    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.sourceCursor$.equals(other.sourceCursor$)
      },
    })

    compose(this, CursorPart, {
      get isAtEnd$() {
        return this.sourceCursor$.equals(this.container._range.end())
      },
    })

    compose(this, SteppableCursorPart, {
      step() {
        this.sourceCursor$.step()
        return this
      },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() {
        return this.sourceCursor$.equals(this.container._range.begin())
      },

      stepBack() {
        this.sourceCursor$.stepBack()
        return this
      },
    })

    compose(this, ReadableCursorPart, {
      get value() {
        return this.sourceCursor$.value
      },
    })

    compose(this, SpannableCursorPart, {
      get spanType() { return this.container.spanType },
      span(other) {
        return this.sourceCursor$.span(other.sourceCursor$)
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
  }
}
