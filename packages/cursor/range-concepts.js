import { Concept } from '@kingjs/partial-concept'
import { 
  CursorConcept, 
  InputCursorConcept, 
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept } from './cursor-concepts.js'
import { Defines } from '@kingjs/partial-class'

export class RangeConcept extends Concept {
  static cursorType = CursorConcept

  static [Defines] = {
    get prototypeCursor() {
      return this.constructor.cursorType?.prototype ?? this.begin()
    },

    get cursorType() { return this.constructor.cursorType },

    *[Symbol.iterator]() { 
      const begin = this.begin()
      const end = this.end()
      for (let cursor = begin; !cursor.equals(end); cursor.step())
        yield cursor.value
    },
  }

  get prototypeCursor() { }
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
export class ForwardRangeConcept extends InputRangeConcept {
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

export function isRange(range) {
  return range instanceof RangeConcept
}

export function isInputRange(range) {
  return isRange(range) &&
    range.prototypeCursor instanceof InputCursorConcept
}

export function isOutputRange(range) {
  return isRange(range) &&
    range.prototypeCursor instanceof OutputCursorConcept
}

export function isForwardRange(range) {
  return isInputRange(range) &&
    range.prototypeCursor instanceof ForwardCursorConcept
}

export function isBidirectionalRange(range) {
  return isForwardRange(range) &&
    range.prototypeCursor instanceof BidirectionalCursorConcept
}

export function isRandomAccessRange(range) {
  return isBidirectionalRange(range) &&
    range.prototypeCursor instanceof RandomAccessCursorConcept
}

export function isContiguousRange(range) {
  return isRandomAccessRange(range) &&
    range.prototypeCursor instanceof ContiguousCursorConcept
}

export class RangeProbe {
  static [Symbol.hasInstance](range) {
    return isRange(range)
  }
}

export class InputRangeProbe extends RangeProbe {
  static [Symbol.hasInstance](range) {
    return isInputRange(range)
  }
}

export class OutputRangeProbe extends RangeProbe {
  static [Symbol.hasInstance](range) {
    return isOutputRange(range)
  }
}

export class ForwardRangeProbe extends InputRangeProbe {
  static [Symbol.hasInstance](range) {
    return isForwardRange(range)
  }
}

export class BidirectionalRangeProbe extends ForwardRangeProbe {
  static [Symbol.hasInstance](range) {
    return isBidirectionalRange(range)
  }
}

export class RandomAccessRangeProbe extends BidirectionalRangeProbe {
  static [Symbol.hasInstance](range) {
    return isRandomAccessRange(range)
  }
}

export class ContiguousRangeProbe extends RandomAccessRangeProbe {
  static [Symbol.hasInstance](range) {
    return isContiguousRange(range)
  }
}
