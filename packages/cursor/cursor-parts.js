import {
  Implements,
} from '@kingjs/partial-concept'
import {
  Abstracts,
  PartialClass,
} from '@kingjs/partial-class'
import {
  Preconditions,
  ThisChecks,
} from '@kingjs/partial-proxy'
import {
  BacktrackableCursorConcept,
  CloneableCursorConcept,
  ComparableToCursorConcept,
  CursorConcept,
  MeasurableCursorConcept,
  MovableCursorConcept,
  ReadableAtCursorConcept,
  ReadableCursorConcept,
  SpannableCursorConcept,
  SteppableCursorConcept,
  WritableAtCursorConcept,
  WritableCursorConcept,
} from './cursor-concept.js'
import { throwNotEquatableTo } from './throw.js'
import {
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from './throw.js'
import {
  HasValue,
  NotAtEnd,
} from './cursor-checks.js'

// Cursor parts are the checked/debug implementation layer. They mirror the
// concept forest rather than the STL shape forest:
//
// CursorPart
// ├─ SteppableCursorPart
// │  └─ BacktrackableCursorPart
// │     └─ MovableCursorPart
// │        ├─ ComparableToCursorPart
// │        └─ MeasurableCursorPart
// ├─ ReadableCursorPart
// │  └─ ReadableAtCursorPart
// ├─ WritableCursorPart
// │  └─ WritableAtCursorPart
// ├─ CloneableCursorPart
// └─ SpannableCursorPart

export class CursorPart extends PartialClass {
  static [Implements] = CursorConcept

  static [Abstracts] = {
    get isAtEnd$() { },
  }

  get isAtEnd$() {
    return this.equals(this.range.end({ constant: true }))
  }
}

export class SteppableCursorPart extends CursorPart {
  static [Implements] = SteppableCursorConcept

  static [ThisChecks] = {
    step: NotAtEnd,
  }

  canStep$() {
    return !this.isAtEnd$
  }
}

export class ReadableCursorPart extends CursorPart {
  static [Implements] = ReadableCursorConcept

  static [ThisChecks] = {
    get value() { return HasValue },
  }

  isReadable$() {
    return !this.isAtEnd$
  }
}

export class WritableCursorPart extends CursorPart {
  static [Implements] = WritableCursorConcept

  static [ThisChecks] = {
    set value(value) { return NotAtEnd },
  }

  isWritable$() {
    return !this.isAtEnd$
  }
}

export class CloneableCursorPart extends PartialClass {
  static [Implements] = CloneableCursorConcept
}

export class BacktrackableCursorPart extends SteppableCursorPart {
  static [Implements] = BacktrackableCursorConcept

  static [Preconditions] = {
    stepBack() {
      if (!this.canStepBack$())
        throwMoveOutOfBounds()
    }
  }

  isAtBegin$() {
    const { range } = this
    if (range.beforeBegin)
      return this.equals(range.beforeBegin({ fixed: true }))

    return this.equals(range.begin({ fixed: true }))
  }

  canStepBack$() {
    return !this.isAtBegin$()
  }
}

export class MovableCursorPart extends BacktrackableCursorPart {
  static [Implements] = MovableCursorConcept

  static [Preconditions] = {
    move(offset) {
      if (!this.canMove$(offset))
        throwMoveOutOfBounds()
    },
  }

  canMove$(offset) {
    const { range } = this
    const begin = range.begin({ constant: true })
    const end = range.end({ constant: true })
    const count = begin.distanceTo(end)
    const index = this.index + offset

    return index >= 0 && index <= count
  }
}

export class ComparableToCursorPart extends MovableCursorPart {
  static [Implements] = ComparableToCursorConcept

  static [Preconditions] = {
    compareTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
  }
}

export class MeasurableCursorPart extends MovableCursorPart {
  static [Implements] = MeasurableCursorConcept

  static [Preconditions] = {
    distanceTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
  }
}

export class ReadableAtCursorPart extends ReadableCursorPart {
  static [Implements] = ReadableAtCursorConcept
  static [Abstracts] = {
    isReadableAt$(offset) { },
  }

  static [Preconditions] = {
    at(offset) {
      if (!this.isReadableAt$(offset))
        throwReadOutOfBounds()
    },
  }
}

export class WritableAtCursorPart extends WritableCursorPart {
  static [Implements] = WritableAtCursorConcept
  static [Abstracts] = {
    isWritableAt$(offset) { },
  }

  static [Preconditions] = {
    setAt(offset, value) {
      if (!this.isWritableAt$(offset))
        throwWriteOutOfBounds()
    },
  }
}

export class SpannableCursorPart extends PartialClass {
  static [Implements] = SpannableCursorConcept

  static [Preconditions] = {
    span(begin, end) {
      if (!this.canSpan$(begin, end))
        throwNotEquatableTo()
    }
  }

  canSpan$(begin, end) {
    if (begin !== undefined && !this.equatableTo(begin)) return false
    if (end !== undefined && !this.equatableTo(end)) return false
    return true
  }
}
