import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  Cursor,
  Range,
  InputCursorConcept,
  CursorPart,
  InputCursorPart,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  BidirectionalCursorPart,
  RandomAccessCursorConcept,
  RandomAccessCursorPart,
  OffsetReadableCursorConcept,
  OffsetReadableCursorPart,
  RandomAccessRangeConcept,
} from '@kingjs/cursor'

class SnapshotCursor extends Cursor {
  _index

  constructor(range, index) {
    super(range)
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

    implement(this, InputCursorConcept, {
      get value() { return this.range._values[this.index] },
    })

    implement(this, ForwardCursorConcept, {
      clone() { return new this.constructor(this.range, this.index) },
      step() { return this.move(1) },
    })

    implement(this, BidirectionalCursorConcept, {
      stepBack() { return this.move(-1) },
    })

    implement(this, RandomAccessCursorConcept, {
      move(offset) {
        this._index += offset
        return this
      },
      compareTo(other) {
        if (this.index < other.index) return -1
        if (this.index > other.index) return 1
        return 0
      },
      distanceTo(other) {
        return other.index - this.index
      },
    })

    implement(this, OffsetReadableCursorConcept, {
      at(offset) {
        return this.range._values[this.index + offset]
      },
    })
  }

  static {
    extend(this, CursorPart, {
      isAtEnd$() { return this.index == this.range._values.length },
      canStep$() { return this.index < this.range._values.length },
    })

    extend(this, InputCursorPart, {
      isAccessible$() {
        return this.index >= 0 && this.index < this.range._values.length
      },
    })

    extend(this, BidirectionalCursorPart, {
      isAtBegin$() { return this.index == 0 },
      canStepBack$() { return this.index > 0 },
    })

    extend(this, RandomAccessCursorPart, {
      canMove$(offset) {
        const index = this.index + offset
        return index >= 0 && index <= this.range._values.length
      },
    })

    extend(this, OffsetReadableCursorPart, {
      isReadableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.range._values.length
      },
    })
  }
}

export class SnapshotView extends Range {
  static cursorType = SnapshotCursor

  _values

  constructor(values) {
    super()
    this._values = values
  }

  static {
    implement(this, RandomAccessRangeConcept, {
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
