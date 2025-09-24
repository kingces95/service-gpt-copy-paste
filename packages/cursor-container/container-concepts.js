import { Concept, Concepts } from '@kingjs/concept'
import {
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from '@kingjs/cursor'

export class RangeConcept extends Concept {
  toRange() { }
}
export class ContainerConcept extends Concept {
  static [Extensions] = {
    toRange() { return new Range(this.begin(), this.end()) },
    get isEmpty() { return this.begin().equals(this.end()) }
  }
  static [Concepts] = [ RangeConcept ]
  static cursorType = CursorConcept

  get begin() { }
  get end() { }
}
export class InputContainerConcept extends Concept {
  static [Concepts] = [ ContainerConcept ]
  static cursorType = InputCursorConcept
}
export class OutputContainerConcept extends Concept {
  static [Concepts] = [ ContainerConcept ]
  static cursorType = OutputCursorConcept
}
export class ForwardContainerConcept extends Concept {
  static [Concepts] = [ InputContainerConcept ]
  static cursorType = ForwardCursorConcept
}
export class BidirectionalContainerConcept extends Concept {
  static [Concepts] = [ ForwardContainerConcept ]
  static cursorType = BidirectionalCursorConcept
}
export class RandomAccessContainerConcept extends Concept {
  static [Concepts] = [ BidirectionalContainerConcept ]
  static cursorType = RandomAccessCursorConcept
}
export class ContiguousContainerConcept extends Concept {
  static [Concepts] = [ RandomAccessContainerConcept ]
  static cursorType = ContiguousCursorConcept
}

// A sequence container is a forward container that supports a front and
// unshift/shift operations.
export class SequenceContainerConcept extends ForwardContainerConcept {
  get front() { }
  unshift(value) { }
  shift() { }
}

// A rewind container is a bidirectional container that supports a back and
// push/pop operations.
export class RewindContainerConcept extends BidirectionalContainerConcept {
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
  get beforeBegin() { }
  insertAfter(cursor, value) { }
  removeAfter(cursor) { }
}

