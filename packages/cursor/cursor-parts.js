import {
  DependsOn,
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

export class SteppableCursorPart extends PartialClass {
  static [Implements] = SteppableCursorConcept
  static [DependsOn] = [
    CursorPart, // isAtEnd$
  ]

  static [ThisChecks] = {
    step: NotAtEnd,
  }

  canStep$() {
    return !this.isAtEnd$
  }
}

export class ReadableCursorPart extends PartialClass {
  static [Implements] = ReadableCursorConcept
  static [DependsOn] = [
    CursorPart, // isAtEnd$
  ]

  static [ThisChecks] = {
    get value() { return HasValue },
  }

  isReadable$() {
    return !this.isAtEnd$
  }
}

export class WritableCursorPart extends PartialClass {
  static [Implements] = WritableCursorConcept
  static [DependsOn] = [
    CursorPart, // isAtEnd$
  ]

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

export class BacktrackableCursorPart extends PartialClass {
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

export class MovableCursorPart extends PartialClass {
  static [Implements] = MovableCursorConcept
  static [DependsOn] = [
    BacktrackableCursorPart, // isAtBegin$
  ]

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

export class ComparableToCursorPart extends PartialClass {
  static [Implements] = ComparableToCursorConcept

  static [Preconditions] = {
    compareTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
  }
}

export class MeasurableCursorPart extends PartialClass {
  static [Implements] = MeasurableCursorConcept

  static [Preconditions] = {
    distanceTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
  }
}

export class ReadableAtCursorPart extends PartialClass {
  static [Implements] = ReadableAtCursorConcept
  static [DependsOn] = [
    CloneableCursorPart, // clone()
    MovableCursorPart, // canMove$
    ReadableCursorPart, // cursor.isReadable$
  ]

  static [Preconditions] = {
    at(offset) {
      if (!this.isReadableAt$(offset))
        throwReadOutOfBounds()
    },
  }

  isReadableAt$(offset) {
    if (!this.canMove$(offset))
      return false

    const cursor = this.clone().move(offset)
    return cursor.isReadable$()
  }
}

export class WritableAtCursorPart extends PartialClass {
  static [Implements] = WritableAtCursorConcept
  static [DependsOn] = [
    CloneableCursorPart, // clone()
    MovableCursorPart, // canMove$
    WritableCursorPart, // cursor.isWritable$
  ]

  static [Preconditions] = {
    setAt(offset, value) {
      if (!this.isWritableAt$(offset))
        throwWriteOutOfBounds()
    },
  }

  isWritableAt$(offset) {
    if (!this.canMove$(offset))
      return false

    const cursor = this.clone().move(offset)
    return cursor.isWritable$()
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
