import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  BacktrackableCursorPart,
  CloneableCursorPart,
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { ContainerCursor } from '@kingjs/cursor-container'

export class VirtualCursor extends ContainerCursor {
  _pageCursor
  _rangeCursor

  constructor(
    container,
    pageCursor,
    rangeCursor = null
  ) {
    super(container)
    this._pageCursor = pageCursor
    this._rangeCursor = rangeCursor
    this._activateRangeCursor()
    this._normalizeRangeEnd()
  }

  get _range() { return this._pageCursor.value }

  _isAtPageBegin() {
    return this._pageCursor.equals(this._pageCursor.range.begin())
  }

  _isAtPageEnd() {
    return this._pageCursor.equals(this._pageCursor.range.end())
  }

  _isAtRangeBegin() {
    return !this._rangeCursor || this._rangeCursor.equals(this._range.begin())
  }

  _isAtRangeEnd() {
    return !this._rangeCursor || this._rangeCursor.equals(this._range.end())
  }

  _activateRangeCursor() {
    if (this._isAtPageEnd())
      return

    this._rangeCursor ??= this._range.begin()
  }

  _resetRangeCursor() {
    this._rangeCursor = null
    this._activateRangeCursor()
  }

  _normalizeRangeEnd() {
    if (!this._rangeCursor)
      return

    if (!this._isAtRangeEnd())
      return

    this._pageCursor.step()
    this._resetRangeCursor()
  }

  get pageCursor$() { return this._pageCursor }
  get rangeCursor$() { return this._rangeCursor }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        if (!this._pageCursor.equals(other._pageCursor)) return false
        if (!this._rangeCursor && !other._rangeCursor) return true
        return this._rangeCursor.equals(other._rangeCursor)
      },
    })

    compose(this, CursorPart, {
      get isAtEnd$() { return this._isAtPageEnd() },
    })

    compose(this, SteppableCursorPart, {
      step() {
        this._rangeCursor.step()
        this._normalizeRangeEnd()
        return this
      },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() { return this._isAtPageBegin() && this._isAtRangeBegin() },

      stepBack() {
        if (this._isAtRangeBegin()) {
          this._pageCursor.stepBack()
          this._rangeCursor = this._range.end()
        }

        this._rangeCursor.stepBack()
        return this
      },
    })

    compose(this, ReadableCursorPart, {
      get value() { return this._rangeCursor.value },
    })

    compose(this, CloneableCursorPart, {
      clone() {
        return new this.constructor(
          this.container,
          this._pageCursor.clone(),
          this._rangeCursor?.clone?.() ?? this._rangeCursor
        )
      },
    })
  }
}
