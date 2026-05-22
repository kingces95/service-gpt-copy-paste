import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  BacktrackableCursorConcept,
  CloneableCursorConcept,
  ComparableToCursorConcept,
  CursorConcept,
  MeasurableCursorConcept,
  MovableCursorConcept,
  ReadableAtCursorConcept,
  ReadableCursorConcept,
  SteppableCursorConcept,
  WritableAtCursorConcept,
  WritableCursorConcept,
  BacktrackableCursorPart,
  CloneableCursorPart,
  ComparableToCursorPart,
  CursorPart,
  MeasurableCursorPart,
  MovableCursorPart,
  ReadableAtCursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
  WritableAtCursorPart,
  WritableCursorPart,
} from '@kingjs/cursor'
import { ContainerCursor } from './container-cursor.js'

export class IndexableCursor extends ContainerCursor {
  _index

  constructor(indexable, index) {
    super(indexable, index)
    this._index = index
  }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this._index == other._index
      }
    })

    implement(this, SteppableCursorConcept, {
      step() { return this.move(1) },
    })

    implement(this, ReadableCursorConcept, {
      get value() { return this.at(0) },
    })

    implement(this, WritableCursorConcept, {
      set value(value) { this.setAt(0, value) },
    })

    implement(this, CloneableCursorConcept, {
      clone() {
        const { constructor, container, _index: index } = this
        return new constructor(container, index)
      }
    })

    implement(this, BacktrackableCursorConcept, {
      stepBack() { return this.move(-1) }
    })

    implement(this, MovableCursorConcept, {
      move(offset) {
        this._index += offset
        return this
      },
    })

    implement(this, MeasurableCursorConcept, {
      distanceTo(otherCursor) {
        return otherCursor.index - this.index
      },
    })

    implement(this, ComparableToCursorConcept, {
      compareTo(otherCursor) {
        if (this.index < otherCursor.index) return -1
        if (this.index > otherCursor.index) return 1
        return 0
      },
    })

    implement(this, ReadableAtCursorConcept, {
      at(offset) {
        return this.container.at(this.index + offset)
      },
    })

    implement(this, WritableAtCursorConcept, {
      setAt(offset, value) {
        this.container.setAt(this.index + offset, value)
      },
    })
  }

  static {
    extend(this, CursorPart)
    extend(this, CloneableCursorPart)

    extend(this, SteppableCursorPart, {
      isAtEnd$() { return this.index == this.container.size },
      canStep$() { return this.index < this.container.size },
    })

    extend(this, ReadableCursorPart, {
      isReadable$() {
        return this.index >= 0 && this.index < this.container.size
      },
    })

    extend(this, WritableCursorPart, {
      isWritable$() {
        return this.index >= 0 && this.index < this.container.size
      },
    })

    extend(this, BacktrackableCursorPart, {
      isAtBegin$() { return this.index == 0 },
      canStepBack$() { return this.index > 0 },
    })

    extend(this, MovableCursorPart, {
      canMove$(offset) {
        const index = this.index + offset
        return index >= 0 && index <= this.container.size
      },
    })

    extend(this, ComparableToCursorPart)
    extend(this, MeasurableCursorPart)

    extend(this, ReadableAtCursorPart, {
      isReadableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.container.size
      },
    })

    extend(this, WritableAtCursorPart, {
      isWritableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.container.size
      },
    })
  }

  get index() { return this._index }
}
