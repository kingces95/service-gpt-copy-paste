import { 
  Implements,
  EquatableConcept } from '@kingjs/concept'
import { Extends } from '@kingjs/partial-class'
import { throwNotEquatableTo } from './throw.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { 
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
  
  static [Extends] = {
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
        // if (this.equals(container.beforeBegin({ constant: true })))
        //   throwMoveOutOfBounds()
        // else 
        if (this.equals(range.begin({ constant: true })))
          throwMoveOutOfBounds()
      }
    }
  }

  stepBack() { }
}

export class RandomAccessCursorConcept extends BidirectionalCursorConcept {
  static [Preconditions] = {
    compareTo(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    subtract(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    },
    move(offset) {
      const { range } = this
      const begin = range.begin({ constant: true })
      const end = range.end({ constant: true })
      const count = end.subtract(begin)
      offset += this.index
      if (offset < 0) throwMoveOutOfBounds()
      if (offset > count) throwMoveOutOfBounds()
    },
  }

  move(offset) { }
  at(offset) { }
  setAt(offset, value) { }
  compareTo(other) { }
  subtract(other) { }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  static [Preconditions] = {
    data(other) {
      if (!this.equatableTo(other)) throwNotEquatableTo(other)
    }
  }

  static [Extends] = {
    read(length = 1, signed = false, littleEndian = false) {
      return this.readAt(0, length, signed, littleEndian)
    },

    readUInt8() { return this.read() },
    readInt8() { return this.read(1, true) },
  
    readUInt16(littleEndian = false) { return this.read(2, false, littleEndian) },
    readUInt16BE() { return this.readUInt16() },
    readUInt16LE() { return this.readUInt16(true) },
    
    readInt16(littleEndian = false) { return this.read(2, true, littleEndian) },
    readInt16BE() { return this.readInt16() },
    readInt16LE() { return this.readInt16(true) },
  
    readUInt32(littleEndian = false) { return this.read(4, false, littleEndian) },
    readUInt32BE() { return this.readUInt32() },
    readUInt32LE() { return this.readUInt32(true) },
  
    readInt32(littleEndian = false) { return this.read(4, true, littleEndian) },
    readInt32BE() { return this.readInt32() },
    readInt32LE() { return this.readInt32(true) },
  }

  // Deconstruct a cursor to its underlying components. The STL version only
  // returns a buffer and index if the container is contiguous, but this version
  // will also return a set of inner cursors of composit view cursors.
  // Unwrap a cursor to an array cursors or buffer plus index. For example,
  // - JoinView returns [outterCursor, innerCursor]
  // - ComposedView returns [cursor] 
  // - ContiguousContainer returns [buffer, index]
  // - Vector return null because it's neither a composition of other cursors
  //   nor does it have an underlying buffer
  data(other) { }
  readAt(offset, length, signed, littleEndian) { }
}
