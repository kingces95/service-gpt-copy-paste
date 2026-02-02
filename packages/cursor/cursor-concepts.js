import { Concept, Implements } from '@kingjs/concept'
import { PartialClass, Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/debug-proxy'
import { throwNotEquatableTo } from './throw.js'

export class CursorConcept extends Concept {
  static [Preconditions] = PartialClass
  static [Extends] = {
    next() {
      const value = this.value 
      if (!this.step()) return
      return value
    }
  }

  step() { }
  equals(other) { }
  equatableTo(other) { }
}

export class InputCursorConcept extends CursorConcept {
  get value() { }
}

export class OutputCursorConcept extends CursorConcept {
  set value(value) { }
}

export class ForwardCursorConcept extends CursorConcept {
  clone() { }
}

export class BidirectionalCursorConcept extends ForwardCursorConcept {
  stepBack() { }
}

export class RandomAccessCursorConcept extends BidirectionalCursorConcept {
  static [Preconditions] = 
    class extends BidirectionalCursorConcept[Preconditions] {
      compareTo(other) {
        if (!this.equatableTo(other)) throwNotEquatableTo(other)
      }
      subtract(other) {
        if (!this.equatableTo(other)) throwNotEquatableTo(other)
      }
    }

  move(offset) { }
  at(offset) { }
  setAt(offset, value) { }
  compareTo(other) { }
  subtract(other) { }
}

export class ContiguousCursorConcept extends RandomAccessCursorConcept {
  static [Preconditions] = 
    class extends RandomAccessCursorConcept[Preconditions] {
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
