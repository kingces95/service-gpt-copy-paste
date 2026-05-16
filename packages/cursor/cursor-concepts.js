import { 
  Implements,
  EquatableConcept } from '@kingjs/partial-concept'
import { Defines } from '@kingjs/partial-class'
import { throwNotEquatableTo } from './throw.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { 
  throwNull,
  throwMoveOutOfBounds, 
  throwReadOutOfBounds, 
  throwWriteOutOfBounds } from './throw.js'

export class CursorConcept extends EquatableConcept {
  static [Preconditions] = {
    step() { 
      if (this.equals(this.range.end({ constant: true }))) 
        throwMoveOutOfBounds() 
    },
  }
  
  static [Defines] = {
    equatableTo(other) {
      if (other?.constructor != this.constructor) return false
      return this.range == other.range
    },
    next() {
      const value = this.value 
      if (!this.step()) return
      return value
    }
  }

  get range() { }
  step() { }
}

export class InputCursorConcept extends CursorConcept {
  static [Preconditions] = {
    get value() { 
      if (this.equals(this.range.end({ constant: true })))
        throwReadOutOfBounds()
    },
  }

  get value() { }
}

export class OutputCursorConcept extends CursorConcept {
  static [Preconditions] = {
    set value(value) { 
      if (this.equals(this.range.end({ constant: true })))
        throwWriteOutOfBounds()
    },
  }
  
  set value(value) { }
}

export class MutableCursorConcept extends CursorConcept {
  static [Implements] = [ InputCursorConcept, OutputCursorConcept ]
}

export class ForwardCursorConcept extends InputCursorConcept {
  clone() { }
}

export class BidirectionalCursorConcept extends ForwardCursorConcept {
  static [Preconditions] = {
    stepBack() { 
      const { range } = this
      if (range.beforeBegin) {
        if (this.equals(range.beforeBegin({ fixed: true })))
          throwMoveOutOfBounds()
        return
      }

      if (this.equals(range.begin({ fixed: true })))
        throwMoveOutOfBounds()
    }
  }

  stepBack() { }
}

export class RandomAccessCursorConcept extends BidirectionalCursorConcept {
  static [Preconditions] = {
    compareTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    distanceTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    move(offset) {
      const { range } = this
      const begin = range.begin({ constant: true })
      const end = range.end({ constant: true })
      const count = begin.distanceTo(end)
      offset += this.index
      if (offset < 0) throwMoveOutOfBounds()
      if (offset > count) throwMoveOutOfBounds()
    },
  }

  move(offset) { }
  at(offset) { }
  setAt(offset, value) { }
  compareTo(other) { }
  distanceTo(other) { }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  static [Preconditions] = {
    span(begin, end) {
      if (begin !== undefined && !this.equatableTo(begin)) throwNotEquatableTo()
      if (end !== undefined && !this.equatableTo(end)) throwNotEquatableTo()
    }
  }

  get spanType() { }
  span(range) { }
}
