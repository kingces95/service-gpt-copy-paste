import { Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  CursorFactoryConcept,
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,

  throwEmpty,
  throwNotEquatableTo,
  throwUpdateOutOfBounds,
} from '@kingjs/cursor'

export class ContainerConcept extends CursorFactoryConcept {
  [Extends] = {
    get cursorType() { return this.constructor.cursorType },
  }

  static cursorType = CursorConcept

  get isEmpty() { }
  isBegin(cursor) { }
  isEnd(cursor) { }
}

export class InputContainerConcept extends ContainerConcept {
  static cursorType = InputCursorConcept
}
export class OutputContainerConcept extends ContainerConcept {
  static cursorType = OutputCursorConcept
}
export class ForwardContainerConcept extends InputContainerConcept {
  static cursorType = ForwardCursorConcept
}
export class BidirectionalContainerConcept extends ForwardContainerConcept {
  static cursorType = BidirectionalCursorConcept
}
export class RandomAccessContainerConcept extends BidirectionalContainerConcept {
  static cursorType = RandomAccessCursorConcept
}
export class ContiguousContainerConcept extends RandomAccessContainerConcept {
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

// A prolog containers implements a beforeBegin iterator. A beforeBegin 
// cursor is used for implementing insertAfter and removeAfter methods.
export class PrologContainerConcept extends SequenceContainerConcept {
  // static cursorType = ContainerCursorConcept

  [Preconditions] = {
    insertAfter(cursor, value) {
      if (this.container != this) throwNotEquatableTo()
      if (this.isEnd(cursor)) throwUpdateOutOfBounds()
    },
    removeAfter(cursor) {
      if (this.container != this) throwNotEquatableTo()
      if (this.isEnd(cursor)) throwUpdateOutOfBounds()
    }
  }

  beforeBegin() { }
  insertAfter(cursor, value) { }
  removeAfter(cursor) { }
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

export class EpilogContainerConcept extends RewindContainerConcept {
  static [Preconditions] = {
    insert(cursor, value) {
      if (this.container != this) throwNotEquatableTo()
      if (this.isBeforeBegin(cursor)) throwUpdateOutOfBounds()
    },
    remove(cursor) {
      if (this.container != this) throwNotEquatableTo()
      if (this.isEnd(cursor)) throwUpdateOutOfBounds()
      if (this.isBeforeBegin(cursor)) throwUpdateOutOfBounds()
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
  get capacity() { }
  expand(count) { }
  data(index, other) { }
  readAt(cursor, offset, length, signed, littleEndian) { }
  insertRange(begin, end) { }
  removeRange(begin, end) { }
}
  