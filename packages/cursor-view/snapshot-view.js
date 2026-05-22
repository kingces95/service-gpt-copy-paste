import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  BacktrackableCursorPart,
  CloneableCursorPart,
  ComparableToCursorPart,
  MeasurableCursorPart,
  MovableCursorPart,
  ReadableAtCursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
  BacktrackableCursorConcept,
  CloneableCursorConcept,
  ComparableToCursorConcept,
  MeasurableCursorConcept,
  MovableCursorConcept,
  RangeConcept,
  ReadableAtCursorConcept,
  ReadableCursorConcept,
  SteppableCursorConcept,
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

    implement(this, ReadableCursorConcept, {
      get value() { return this.view._values[this.index] },
    })

    implement(this, CloneableCursorConcept, {
      clone() { return new this.constructor(this.view, this.index) },
    })

    implement(this, SteppableCursorConcept, {
      step() { return this.move(1) },
    })

    implement(this, BacktrackableCursorConcept, {
      stepBack() { return this.move(-1) },
    })

    implement(this, MovableCursorConcept, {
      move(offset) {
        this._index += offset
        return this
      },
    })

    implement(this, ComparableToCursorConcept, {
      compareTo(other) {
        if (this.index < other.index) return -1
        if (this.index > other.index) return 1
        return 0
      },
    })

    implement(this, MeasurableCursorConcept, {
      distanceTo(other) {
        return other.index - this.index
      },
    })

    implement(this, ReadableAtCursorConcept, {
      at(offset) {
        return this.view._values[this.index + offset]
      },
    })
  }

  static {
    extend(this, SteppableCursorPart, {
      isAtEnd$() { return this.index == this.view._values.length },
      canStep$() { return this.index < this.view._values.length },
    })

    extend(this, ReadableCursorPart, {
      isReadable$() {
        return this.index >= 0 && this.index < this.view._values.length
      },
    })

    extend(this, CloneableCursorPart)

    extend(this, BacktrackableCursorPart, {
      isAtBegin$() { return this.index == 0 },
      canStepBack$() { return this.index > 0 },
    })

    extend(this, MovableCursorPart, {
      canMove$(offset) {
        const index = this.index + offset
        return index >= 0 && index <= this.view._values.length
      },
    })

    extend(this, ComparableToCursorPart)
    extend(this, MeasurableCursorPart)

    extend(this, ReadableAtCursorPart, {
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
