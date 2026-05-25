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
import {
  cursorPrototypeOf,
} from './projections.js'

export class RangeShape extends Shape {
  get cursorType() { }
  begin() { }
  end() { }
}

// std::ranges::range<R>
export function isRange(range) {
  return range instanceof RangeShape
}

// std::ranges::input_range<R>
export function isReadableRange(range) {
  return isRange(range) &&
    cursorPrototypeOf(range) instanceof InputCursorShape
}

// output_range<R, T>
export function isWritableRange(range) {
  return isRange(range) &&
    cursorPrototypeOf(range) instanceof OutputCursorShape
}

// std::ranges::forward_range<R>
export function isForwardRange(range) {
  return isReadableRange(range) &&
    cursorPrototypeOf(range) instanceof ForwardCursorShape
}

// std::ranges::bidirectional_range<R>
export function isBidirectionalRange(range) {
  return isForwardRange(range) &&
    cursorPrototypeOf(range) instanceof BidirectionalCursorShape
}

// std::ranges::random_access_range<R>
export function isRandomAccessRange(range) {
  return isBidirectionalRange(range) &&
    cursorPrototypeOf(range) instanceof RandomAccessCursorShape
}

// output_range<R, T> && std::ranges::random_access_range<R>
export function isWritableRandomAccessRange(range) {
  return isRandomAccessRange(range) &&
    cursorPrototypeOf(range) instanceof WritableRandomAccessCursorShape
}

// std::ranges::contiguous_range<R>
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
