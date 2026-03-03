import { Concept } from '@kingjs/concept'
import { 
  CursorConcept, 
  InputCursorConcept, 
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept } from './cursor-concepts.js'
import { Extends } from '@kingjs/partial-class'

export class RangeConcept extends Concept {
  static cursorType = CursorConcept

  static [Extends] = [{
    get cursorType() { return this.constructor.cursorType },
    // implement iterator
    *[Symbol.iterator]() { 
      const begin = this.begin()
      const end = this.end()
      for (let cursor = begin; !cursor.equals(end); cursor.step())
        yield cursor.value
    },
  }]

  get cursorType() { }
  begin() { }
  end() { }
}
export class InputRangeConcept extends RangeConcept {
  static cursorType = InputCursorConcept
}
export class OutputRangeConcept extends RangeConcept {
  static cursorType = OutputCursorConcept
}
export class ForwardRangeConcept extends RangeConcept {
  static cursorType = ForwardCursorConcept
}
export class BidirectionalRangeConcept extends ForwardRangeConcept {
  static cursorType = BidirectionalCursorConcept
}
export class RandomAccessRangeConcept extends BidirectionalRangeConcept {
  static cursorType = RandomAccessCursorConcept
}
export class ContiguousRangeConcept extends RandomAccessRangeConcept {
  static cursorType = ContiguousCursorConcept
}
