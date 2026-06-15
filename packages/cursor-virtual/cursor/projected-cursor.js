import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { define, defineAbstract } from '@kingjs/partial-define'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
  VirtualCursorPart,
} from '@kingjs/cursor'
import { advance, distance } from '@kingjs/cursor-algorithm'
import { ContainerCursor } from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { Page } from '../container/page-container.js'

export class ProjectedCursor extends ContainerCursor {
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
        return this.sourceCursor$.equals(this.container.end().sourceCursor$)
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

    compose(this, VirtualCursorPart, {
      *pages(other) {
        const begin = this.sourceCursor$
        const end = other.sourceCursor$
        const range = typeof begin.materialize == 'function'
          ? begin.materialize(end)
          : subrange(begin, end)

        yield new Page(range, {
          virtualize: cursor => {
            if (cursor.equals(range.end()))
              return other.clone()

            const result = this.clone()
            advance(result.sourceCursor$, distance(subrange(range.begin(),
              cursor)))
            return result
          },
        })
      },

      materialize(other) {
        const begin = this.sourceCursor$
        const end = other.sourceCursor$

        return typeof begin.materialize == 'function'
          ? begin.materialize(end)
          : subrange(begin, end)
      },
    })
  }
}
