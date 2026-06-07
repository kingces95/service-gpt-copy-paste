import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  BacktrackableCursorPart,
  CloneableCursorPart,
  ComparableToCursorPart,
  CursorPart,
  MeasurableCursorPart,
  MovableCursorPart,
  ReadableAtCursorPart,
  ReadableCursorPart,
  RangeConcept,
  SpannableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import { ViewCursor } from './cursor/view-cursor.js'

class TypedArrayCursor extends ViewCursor {
  _index

  constructor(view, index) {
    super(view)
    this._index = index
  }

  get index() { return this._index }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.index == other.index
      },
    })
  }

  static {
    compose(this, CursorPart, {
      get isAtEnd$() { return this.index == this.view.size },
    })

    compose(this, SteppableCursorPart, {
      step() { return this.move(1) },
      canStep$() { return this.index < this.view.size },
    })

    compose(this, BacktrackableCursorPart, {
      stepBack() { return this.move(-1) },
      isAtBegin$() { return this.index == 0 },
      canStepBack$() { return this.index > 0 },
    })

    compose(this, MovableCursorPart, {
      move(offset) {
        this._index += offset
        return this
      },

      canMove$(offset) {
        const index = this.index + offset
        return index >= 0 && index <= this.view.size
      },
    })

    compose(this, ComparableToCursorPart, {
      compareTo(other) {
        if (this.index < other.index) return -1
        if (this.index > other.index) return 1
        return 0
      },
    })

    compose(this, MeasurableCursorPart, {
      distanceTo(other) {
        return other.index - this.index
      },
    })

    compose(this, ReadableCursorPart, {
      get value() { return this.view.array[this.index] },

      isReadable$() {
        return this.index >= 0 && this.index < this.view.size
      },
    })

    compose(this, ReadableAtCursorPart, {
      at(offset) {
        return this.view.array[this.index + offset]
      },

      isReadableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.view.size
      },
    })

    compose(this, CloneableCursorPart, {
      clone() { return new this.constructor(this.view, this.index) },
    })

    compose(this, SpannableCursorPart, {
      get spanType() { return this.view.array.constructor },
      span(other) { return this.view.span(this, other) },
    })
  }
}

export class TypedArrayView extends PartialProxy {
  static cursorType = TypedArrayCursor

  _array

  constructor(array) {
    super()
    assert(ArrayBuffer.isView(array) && typeof array.subarray == 'function',
      'TypedArrayView requires an ArrayBuffer view with subarray().')
    this._array = array
  }

  get array() { return this._array }
  get size() { return this._array.length }
  get spanType() { return this._array.constructor }

  span(begin = this.begin(), end = this.end()) {
    return this._array.subarray(begin.index, end.index)
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.size) },
    })
  }
}
