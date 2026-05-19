import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  Cursor,
  Range,
  InputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  OffsetReadableCursorConcept,
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
