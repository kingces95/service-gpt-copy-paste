import { 
  DependsOn,
  Implements,
  EquatableConcept } from '@kingjs/partial-concept'
import { PartialClass } from '@kingjs/partial-class'
import { Defines } from '@kingjs/partial-class'
import { throwNotEquatableTo } from './throw.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { 
  throwMoveOutOfBounds, 
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from './throw.js'

export class CursorConcept extends EquatableConcept {
  static [Defines] = {
    equatableTo(other) {
      if (other?.constructor != this.constructor) return false
      return this.range == other.range
    },
  }

  get range() { }
  step() { }
}

export class CursorPart extends PartialClass {
  static [Implements] = CursorConcept

  static [Preconditions] = {
    step() {
      if (!this.canStep$())
        throwMoveOutOfBounds()
    },
  }

  isAtEnd$() {
    return this.equals(this.range.end({ constant: true }))
  }

  canStep$() {
    return !this.isAtEnd$()
  }
}

export class InputCursorConcept extends CursorConcept {
  get value() { }
}

export class InputCursorPart extends PartialClass {
  static [Implements] = InputCursorConcept
  static [DependsOn] = [ 
    CursorPart, // isAtEnd$
  ]

  static [Preconditions] = {
    get value() {
      if (!this.isAccessible$())
        throwReadOutOfBounds()
    },
  }

  isAccessible$() {
    return !this.isAtEnd$()
  }
}

export class OutputCursorConcept extends CursorConcept {
  set value(value) { }
}

export class OutputCursorPart extends PartialClass {
  static [Implements] = OutputCursorConcept
  static [DependsOn] = [
    CursorPart, // isAtEnd$
  ]

  static [Preconditions] = {
    set value(value) {
      if (!this.isAccessible$())
        throwWriteOutOfBounds()
    },
  }

  isAccessible$() {
    return !this.isAtEnd$()
  }
}

export class MutableCursorConcept extends CursorConcept {
  static [Implements] = [ InputCursorConcept, OutputCursorConcept ]
}

export class ForwardCursorConcept extends InputCursorConcept {
  clone() { }
}

export class BidirectionalCursorConcept extends ForwardCursorConcept {
  stepBack() { }
}

export class BidirectionalCursorPart extends PartialClass {
  static [Implements] = BidirectionalCursorConcept

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

export class RandomAccessCursorConcept extends BidirectionalCursorConcept {
  move(offset) { }
  compareTo(other) { }
  distanceTo(other) { }
}

export class RandomAccessCursorPart extends PartialClass {
  static [Implements] = RandomAccessCursorConcept

  static [Preconditions] = {
    compareTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    distanceTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
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

export class OffsetReadableCursorConcept extends InputCursorConcept {
  static [Implements] = RandomAccessCursorConcept

  at(offset) { }
}

export class OffsetReadableCursorPart extends PartialClass {
  static [Implements] = OffsetReadableCursorConcept
  static [DependsOn] = [
    InputCursorPart, // isAccessible$
    RandomAccessCursorPart, // canMove$
  ]

  static [Preconditions] = {
    at(offset) {
      if (!this.isReadableAt$(offset))
        throwReadOutOfBounds()
    },
  }

  isReadableAt$(offset) {
    if (!this.canMove$(offset)) return false

    const cursor = this.clone().move(offset)
    return cursor.isAccessible$()
  }
}

export class OffsetWritableCursorConcept extends OutputCursorConcept {
  static [Implements] = RandomAccessCursorConcept

  setAt(offset, value) { }
}

export class OffsetWritableCursorPart extends PartialClass {
  static [Implements] = OffsetWritableCursorConcept
  static [DependsOn] = [
    OutputCursorPart, // isAccessible$
    RandomAccessCursorPart, // canMove$
  ]

  static [Preconditions] = {
    setAt(offset, value) {
      if (!this.isWritableAt$(offset))
        throwWriteOutOfBounds()
    },
  }

  isWritableAt$(offset) {
    if (!this.canMove$(offset)) return false

    const cursor = this.clone().move(offset)
    return cursor.isAccessible$()
  }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  get spanType() { }
  span(range) { }
}

export class ContiguousCursorPart extends PartialClass {
  static [Implements] = ContiguousCursorConcept

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
