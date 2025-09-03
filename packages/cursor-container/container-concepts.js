import { Concept, Satisfies } from '@kingjs/concept'
import {
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from '@kingjs/cursor'

export class ContainerConcept extends Concept {
  static cursorType = CursorConcept
  static [Satisfies](container) {
    const containerType = container?.constructor
    return containerType?.cursorType?.prototype instanceof this.cursorType
  }
}
export class InputContainerConcept extends ContainerConcept {
  static cursorType = InputCursorConcept
}
export class OutputContainerConcept extends ContainerConcept {
  static cursorType = OutputCursorConcept
}
export class ForwardContainerConcept extends ContainerConcept {
  static cursorType = ForwardCursorConcept
}
export class BidirectionalContainerConcept extends ContainerConcept {
  static cursorType = BidirectionalCursorConcept
}
export class RandomAccessContainerConcept extends ContainerConcept {
  static cursorType = RandomAccessCursorConcept
}
export class ContiguousContainerConcept extends ContainerConcept {
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

