import { Shape } from '@kingjs/partial-shape'
import {
  BidirectionalCursorShape,
  ContiguousCursorShape,
  ForwardCursorShape,
  InputCursorShape,
  OutputCursorShape,
  RandomAccessCursorShape,
  WritableRandomAccessCursorShape,
} from './cursor-shapes.js'

export class RangeShape extends Shape {
  get cursorType() { }
  begin() { }
  end() { }
}

function cursorPrototypeOf(range) {
  return range.cursorType?.prototype
}

export function isRange(range) {
  return range instanceof RangeShape
}

export function isReadableRange(range) {
  return isRange(range) &&
    cursorPrototypeOf(range) instanceof InputCursorShape
}

export function isWritableRange(range) {
  return isRange(range) &&
    cursorPrototypeOf(range) instanceof OutputCursorShape
}

export function isForwardRange(range) {
  return isReadableRange(range) &&
    cursorPrototypeOf(range) instanceof ForwardCursorShape
}

export function isBidirectionalRange(range) {
  return isForwardRange(range) &&
    cursorPrototypeOf(range) instanceof BidirectionalCursorShape
}

export function isRandomAccessRange(range) {
  return isBidirectionalRange(range) &&
    cursorPrototypeOf(range) instanceof RandomAccessCursorShape
}

export function isWritableRandomAccessRange(range) {
  return isRandomAccessRange(range) &&
    cursorPrototypeOf(range) instanceof WritableRandomAccessCursorShape
}

export function isContiguousRange(range) {
  return isRandomAccessRange(range) &&
    cursorPrototypeOf(range) instanceof ContiguousCursorShape
}

export class RangeProbe {
  static [Symbol.hasInstance](range) {
    return isRange(range)
  }
}

export class ReadableRangeProbe extends RangeProbe {
  static [Symbol.hasInstance](range) {
    return isReadableRange(range)
  }
}

export class WritableRangeProbe extends RangeProbe {
  static [Symbol.hasInstance](range) {
    return isWritableRange(range)
  }
}

export class ForwardRangeProbe extends ReadableRangeProbe {
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

export class WritableRandomAccessRangeProbe extends RandomAccessRangeProbe {
  static [Symbol.hasInstance](range) {
    return isWritableRandomAccessRange(range)
  }
}

export class ContiguousRangeProbe extends RandomAccessRangeProbe {
  static [Symbol.hasInstance](range) {
    return isContiguousRange(range)
  }
}
