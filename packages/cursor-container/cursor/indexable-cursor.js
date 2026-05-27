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

    extend(this, CursorPart, {
      get isAtEnd$() { return this.index == this.container.size },
    })

    extend(this, CloneableCursorPart, {
      clone() {
        const { constructor, container, _index: index } = this
        return new constructor(container, index)
      }
    })

    extend(this, SteppableCursorPart, {
      step() { return this.move(1) },
      canStep$() { return this.index < this.container.size },
    })

    extend(this, ReadableCursorPart, {
      get value() { return this.at(0) },

      isReadable$() {
        return this.index >= 0 && this.index < this.container.size
      },
    })

    extend(this, WritableCursorPart, {
      set value(value) { this.setAt(0, value) },

      isWritable$() {
        return this.index >= 0 && this.index < this.container.size
      },
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
        return index >= 0 && index <= this.container.size
      },
    })

    extend(this, ComparableToCursorPart, {
      compareTo(otherCursor) {
        if (this.index < otherCursor.index) return -1
        if (this.index > otherCursor.index) return 1
        return 0
      },
    })

    extend(this, MeasurableCursorPart, {
      distanceTo(otherCursor) {
        return otherCursor.index - this.index
      },
    })

    extend(this, ReadableAtCursorPart, {
      at(offset) {
        return this.container.at(this.index + offset)
      },

      isReadableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.container.size
      },
    })

    extend(this, WritableAtCursorPart, {
      setAt(offset, value) {
        this.container.setAt(this.index + offset, value)
      },

      isWritableAt$(offset) {
        const index = this.index + offset
        return index >= 0 && index < this.container.size
      },
    })
  }

  get index() { return this._index }
}
