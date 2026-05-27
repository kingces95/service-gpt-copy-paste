import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  BacktrackableCursorPart,
  CloneableCursorPart,
  ComparableToCursorPart,
  CursorPart,
  MeasurableCursorPart,
  MovableCursorPart,
  ReadableAtCursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
  RangeConcept,
} from '@kingjs/cursor'
import { PartialProxy } from '@kingjs/partial-proxy'
import { ViewCursor } from './cursor/view-cursor.js'

class SnapshotCursor extends ViewCursor {
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

    extend(this, CursorPart, {
      get isAtEnd$() { return this.index == this.view._values.length },
    })

    extend(this, SteppableCursorPart, {
      step() { return this.move(1) },
      canStep$() { return this.index < this.view._values.length },
    })

    extend(this, ReadableCursorPart, {
      get value() { return this.view._values[this.index] },

      isReadable$() {
        return this.index >= 0 && this.index < this.view._values.length
      },
    })

    extend(this, CloneableCursorPart, {
      clone() { return new this.constructor(this.view, this.index) },
    })

    extend(this, BacktrackableCursorPart, {
      stepBack() { return this.move(-1) },
      isAtBegin$() { return this.index == 0 },
      canStepBack$() { return this.index > 0 },
    })

    extend(this, MovableCursorPart, {
      move(offset) {
        this._index += offset
        return this
      },

      canMove$(offset) {
        const index = this.index + offset
        return index >= 0 && index <= this.view._values.length
      },
    })

    extend(this, ComparableToCursorPart, {
      compareTo(other) {
        if (this.index < other.index) return -1
        if (this.index > other.index) return 1
        return 0
      },
    })

    extend(this, MeasurableCursorPart, {
      distanceTo(other) {
        return other.index - this.index
      },
    })

    extend(this, ReadableAtCursorPart, {
      at(offset) {
        return this.view._values[this.index + offset]
      },

      isReadableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.view._values.length
      },
    })
  }
}

export class SnapshotView extends PartialProxy {
  static cursorType = SnapshotCursor

  _values

  constructor(values) {
    super()
    this._values = values
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this._values.length) },
    })
  }
}

export function snapshot(range) {
  const values = []
  const first = range.begin()
  const last = range.end()

  while (!first.equals(last)) {
    values.push(first.value)
    first.step()
  }

  return new SnapshotView(values)
}
