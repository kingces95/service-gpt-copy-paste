import { Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  RangeConcept,
  ForwardRangeConcept,
  InputRangeConcept,
  OutputRangeConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,

  throwNull,
  throwEmpty,
  throwNotEquatableTo,
  throwUpdateOutOfBounds,
} from '@kingjs/cursor'
import { Implements } from '@kingjs/concept'

export class ContainerConcept extends RangeConcept {
  [Extends] = {
    get cursorType() { return this.constructor.cursorType },
    get isEmpty() { 
      return this.begin({ fixed: true })
        .equals(this.end({ fixed: true }))
    }
  }

  get isEmpty() { }
}

export class InputContainerConcept
  extends ContainerConcept {
  static cursorType = InputCursorConcept
  static [Implements] = InputRangeConcept
}
export class OutputContainerConcept 
  extends ContainerConcept {
  static cursorType = OutputCursorConcept
  static [Implements] = OutputRangeConcept
}
export class ForwardContainerConcept 
  extends InputContainerConcept {
  static cursorType = ForwardCursorConcept
  static [Implements] = ForwardRangeConcept
}
export class BidirectionalContainerConcept 
  extends ForwardContainerConcept {
  static cursorType = BidirectionalCursorConcept
}
export class RandomAccessContainerConcept 
  extends BidirectionalContainerConcept {
  static cursorType = RandomAccessCursorConcept
}
export class ContiguousContainerConcept 
  extends RandomAccessContainerConcept {
  static cursorType = ContiguousCursorConcept
}

// A sequence container is a forward container that supports a front and
// unshift/shift operations.
export class SequenceContainerConcept extends ForwardContainerConcept { 
  static [Preconditions] = {
    shift() { if (this.isEmpty) throwEmpty() },
    get front() { if (this.isEmpty) throwEmpty() }
  }

  get front() { }
  unshift(value) { }
  shift() { }
}

// A rewind container is a bidirectional container that supports a back and
// push/pop operations.
export class RewindContainerConcept extends BidirectionalContainerConcept {
  static [Preconditions] = {
    pop() { if (this.isEmpty) throwEmpty() },
    get back() { if (this.isEmpty) throwEmpty() },
  }
    
  static [Extends] = {
    get isEmpty() { return this.count == 0 }
  }
  
  get count() { }
  get back() { }
  pop() { }
  push(value) { }
}

export class EditableContainerConcept extends RewindContainerConcept {
  static [Preconditions] = {
    insert(cursor, value) {
      if (this != this) throwNotEquatableTo()
    },
    remove(cursor) {
      if (this != this) throwNotEquatableTo()
      if (this.end({ fixed: true }).equals(cursor)) throwUpdateOutOfBounds()
    }
  }
  
  insert(cursor, value) { }
  remove(cursor) { }
}

// An indexable container is a rewind container that supports random access
// operations.
export class IndexableContainerConcept extends RewindContainerConcept {
  at(index) { }
  setAt(index, value) { }
}

export class BufferContainerConcept extends IndexableContainerConcept {
  static [Extends] = {
    ensureCapacity(count) {
      if (count <= this.capacity) return this.capacity
      const newCapacity = Math.max(count, this.capacity * 2)
      this.setCapacity(newCapacity)
      return newCapacity
    },
    insertRange(cursor, begin, end) { 
      const length = end.subtract(begin)
      this.ensureCapacity(this.count + length)
      this.copy(cursor, begin, end)
    },
    eraseRange(begin, end) { 
      this.copy(begin, end, this.end())
    },
  }
  get capacity() { }
  setCapacity(count) { }
  copy(cursor, begin, end) { }
  readAt(cursor, offset, length, signed, littleEndian) { }
  writeAt(cursor, offset, value, length, signed, littleEndian) { }
  data(index, other) { }
}
