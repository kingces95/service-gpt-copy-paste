import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { define, defineAbstract } from '@kingjs/partial-define'
import { EquatableConcept } from '@kingjs/partial-concept'
import { assert } from '@kingjs/assert'
import {
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
  VirtualCursorPart,
} from '@kingjs/cursor'
import { advance } from '@kingjs/cursor-algorithm'
import { ContainerCursor } from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { genericType } from '@kingjs/generic'

export const ProjectedRangeCursorOf = genericType(TSpan => {
  return class ProjectedRangeCursor extends ContainerCursor {
    static spanType = TSpan

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

      compose(this, VirtualCursorPart, {
        *pages(other) {
          const begin = this.sourceCursor$
          const end = other.sourceCursor$
          const range = typeof begin.materialize == 'function'
            ? begin.materialize(end)
            : subrange(begin, end)
          const pageBegin = range.begin()
          const pageEnd = range.end()

          yield {
            begin: pageBegin,
            end: pageEnd,
            cursorAt: offset => {
              // The page currently starts at this projected cursor's source.
              // If a future virtual layer trims the page begin without
              // consuming that prefix, this mapping must account for it.
              assert(offset == 0 || !pageBegin.equals(pageEnd),
                'Projected page offsets are relative to page begin.')
              const pageCursor = pageBegin.clone()
              advance(pageCursor, offset)
              if (pageCursor.equals(pageEnd))
                return other.clone()

              const cursor = begin.clone()
              advance(cursor, offset)
              return new this.constructor(this.container, cursor)
            },
          }
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
})

export const ProjectedRangeCursor = ProjectedRangeCursorOf(Object)
