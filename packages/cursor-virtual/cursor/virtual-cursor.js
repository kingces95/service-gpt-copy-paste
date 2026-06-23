import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  BacktrackableCursorConcept,
  BacktrackableCursorPart,
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { ContainerCursor } from '@kingjs/cursor-container'

export class VirtualCursor extends ContainerCursor {
  _outerCursor
  _innerCursor
  _innerCursorEnd

  constructor(
    container,
    outerCursor,
    innerCursor = null,
    innerCursorEnd = null
  ) {
    super(container)
    this._outerCursor = outerCursor
    this._innerCursor = innerCursor
    this._innerCursorEnd = innerCursorEnd
    this._normalizePageEnd()
  }

  get outerCursor$() { return this._outerCursor }
  set outerCursor$(outerCursor) { this._outerCursor = outerCursor }
  get innerCursor$() { return this._innerCursor }
  set innerCursor$(innerCursor) { this._innerCursor = innerCursor }
  get innerCursorEnd$() { return this._innerCursorEnd }
  set innerCursorEnd$(innerCursorEnd) { this._innerCursorEnd = innerCursorEnd }

  get storedPage() { return this.outerCursor$.value }
  get storedRange() { return this.storedPage.range }

  getOuterBegin() {
    return this.outerCursor$.range.begin()
  }

  getOuterEnd() {
    return this.outerCursor$.range.end()
  }

  getInnerCursor() {
    if (!this.innerCursor$)
      this.innerCursor$ = this.storedRange.begin()

    return this.innerCursor$
  }

  getInnerCursorEnd() {
    if (!this.innerCursorEnd$)
      this.innerCursorEnd$ = this.storedRange.end()

    return this.innerCursorEnd$
  }

  resetInnerCursor() {
    this.innerCursor$ = null
    this.innerCursorEnd$ = null
  }

  _normalizePageEnd() {
    if (!this.innerCursor$ || !this.innerCursorEnd$)
      return

    if (!this.innerCursor$.equals(this.innerCursorEnd$))
      return

    this.outerCursor$.step()
    this.resetInnerCursor()
  }

  popRangePrefix() {
    const page = this.storedPage
    const range = this.storedRange
    const begin = range.begin()
    const inner = this.getInnerCursor()

    if (begin.equals(inner))
      return null

    return this.container._replaceStoredPage(
      this.outerCursor$,
      page,
      inner
    )
  }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        if (!this.outerCursor$.equals(other.outerCursor$)) return false
        if (this.outerCursor$.equals(this.outerCursor$.range.end()))
          return true

        return this.getInnerCursor().equals(other.getInnerCursor())
      },
    })

    implement(this, BacktrackableCursorConcept, {
      stepBack() {
        if (this.outerCursor$.equals(this.getOuterEnd())) {
          this.outerCursor$.stepBack()
          this.innerCursor$ = this.storedRange.end()
          this.innerCursorEnd$ = this.innerCursor$.clone?.()
            ?? this.innerCursor$
        }
        else if (this.getInnerCursor().equals(this.storedRange.begin())) {
          this.outerCursor$.stepBack()
          this.innerCursor$ = this.storedRange.end()
          this.innerCursorEnd$ = this.innerCursor$.clone?.()
            ?? this.innerCursor$
        }

        this.getInnerCursor().stepBack()
        return this
      },
    })

    compose(this, CursorPart, {
      get isAtEnd$() {
        return this.outerCursor$.isAtEnd$
      },
    })

    compose(this, SteppableCursorPart, {
      step() {
        this.getInnerCursor().step()

        if (!this.getInnerCursor().equals(this.getInnerCursorEnd()))
          return this

        this.outerCursor$.step()
        this.resetInnerCursor()
        return this
      },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() {
        if (!this.outerCursor$.equals(this.getOuterBegin()))
          return false

        return !this.innerCursor$
          || this.innerCursor$.equals(this.storedRange.begin())
      },
    })

    compose(this, ReadableCursorPart, {
      get value() { return this.getInnerCursor().value },
    })

    compose(this, CloneableCursorPart, {
      clone() {
        return new this.constructor(
          this.container,
          this.outerCursor$.clone(),
          this.innerCursor$?.clone?.() ?? this.innerCursor$,
          this.innerCursorEnd$?.clone?.() ?? this.innerCursorEnd$
        )
      },
    })
  }
}
