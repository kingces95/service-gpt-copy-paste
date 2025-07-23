import { Concept, Test } from '@kingjs/concept'
import {
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from '@kingjs/cursor'

export class ContainerConcept extends Concept {
  static cursorType = null
  static [Test](container) {
    const containerType = container?.constructor
    return containerType?.cursorType instanceof this.cursorType
  }
}
export class InputContainerConcept extends ContainerConcept {
  static cursorType = InputCursorConcept
}
export class OutputContainerConcept extends ContainerConcept {
  static cursorType = OutputCursorConcept
}
export class ForwardContainer extends ContainerConcept {
  static cursorType = ForwardCursorConcept
}
export class ReversibleContainerConcept extends ContainerConcept {
  static cursorType = BidirectionalCursorConcept
}
export class RandomAccessContainerConcept extends ContainerConcept {
  static cursorType = RandomAccessCursorConcept
}
export class ContiguousContainerConcept extends ContainerConcept {
  static cursorType = ContiguousCursorConcept
}

// A prolog containers implements a beforeBegin iterator. A beforeBegin 
// cursor is used for implementing insertAfter and removeAfter methods.
export class PrologContainerConcept extends Concept {
  get beforeBegin() { }
  insertAfter(cursor, value) { }
  removeAfter(cursor) { }
}

