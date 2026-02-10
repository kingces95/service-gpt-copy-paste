import { Concept, DisposeConcept } from '@kingjs/concept'
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
} from '@kingjs/cursor'

export class ContainerConcept extends CursorFactoryConcept {
  [Extends] = {
    get cursorType() { return this.constructor.cursorType }
  }

  static cursorType = CursorConcept
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

// A rewind container is a bidirectional container that supports a back and
// push/pop operations.
export class RewindContainerConcept extends BidirectionalContainerConcept {
  static [Extends] = {
    get isEmpty() { return this.count == 0 }
  }
  
  get count() { }
  get back() { }
  pop() { }
  push(value) { }
}

// An indexable container is a rewind container that supports random access
// operations.
export class IndexableContainerConcept extends RewindContainerConcept {
  at(index) { }
  setAt(index, value) { }
}

// A prolog containers implements a beforeBegin iterator. A beforeBegin 
// cursor is used for implementing insertAfter and removeAfter methods.
export class PrologContainerConcept extends Concept {
  beforeBegin() { }
  insertAfter(cursor, value) { }
  removeAfter(cursor) { }
}

export class EpilogContainerConcept extends Concept {
  insert(cursor, value) { }
  remove(cursor) { }
}

// Implementation detail: dollar-suffixed concepts capture the interface
// between a container and its cursors via tokens as used by this 
// implementation.

export class SequenceContainerConcept$ {

  // basic cursor
  equals$(token, other) { }

  // step cursor
  step$(token) { }

  // input cursor
  value$(token) { }

  // output cursor
  setValue$(token, value) { }
}

export class RewindContainerConcept$ extends SequenceContainerConcept$ {

  // rewind cursor
  stepBack$(token) { } 
}

export class IndexableContainerConcept$ extends RewindContainerConcept$ {

  // indexable cursor
  at$(index, offset) { }
  setAt$(index, offset, value) { }
  subtract$(index, otherCursor) { }
  move$(index, offset) { }
  compareTo$(index, otherCursor) { }
}

export class ContiguousContainerConcept$ extends IndexableContainerConcept$ {

  // contiguous cursor
  readAt$(index, offset, length, signed, littleEndian) { throwNotImplemented() }
}