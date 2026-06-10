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
  spanTypeOfRange,
} from './projections.js'

export class RangeShape extends Shape {
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

// span_projected_range<R>
export function isSpanProjectedRange(range) {
  return isRange(range) &&
    typeof range.spans == 'function' &&
    spanTypeOfRange(range) != null
}

export class ReadableRangeShape extends RangeShape {
  static [Symbol.hasInstance](range) {
    return isReadableRange(range)
  }
}

export class WritableRangeShape extends RangeShape {
  static [Symbol.hasInstance](range) {
    return isWritableRange(range)
  }
}

export class ForwardRangeShape extends ReadableRangeShape {
  static [Symbol.hasInstance](range) {
    return isForwardRange(range)
  }
}

export class BidirectionalRangeShape extends ForwardRangeShape {
  static [Symbol.hasInstance](range) {
    return isBidirectionalRange(range)
  }
}

export class RandomAccessRangeShape extends BidirectionalRangeShape {
  static [Symbol.hasInstance](range) {
    return isRandomAccessRange(range)
  }
}

export class WritableRandomAccessRangeShape extends RandomAccessRangeShape {
  static [Symbol.hasInstance](range) {
    return isWritableRandomAccessRange(range)
  }
}

export class ContiguousRangeShape extends RandomAccessRangeShape {
  static [Symbol.hasInstance](range) {
    return isContiguousRange(range)
  }
}

export class SpanProjectedRangeShape extends RangeShape {
  static [Symbol.hasInstance](range) {
    return isSpanProjectedRange(range)
  }
}
