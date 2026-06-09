import { assert } from '@kingjs/assert'

// ____________________________________________________________________________
// RANGE PROJECTIONS

// std::ranges::iterator_t<R>
export function cursorTypeOfRangeType(type) {
  return type?.cursorType
}
export function cursorTypeOf(range) {
  return range.cursorType
}

// std::ranges::iterator_t<R>::prototype
export function cursorPrototypeOf(range) {
  return cursorTypeOf(range)?.prototype
}

// span_type_t<R>
export function spanTypeOfRangeType(type) {
  return type?.spanType ??
    spanTypeOfCursorType(cursorTypeOfRangeType(type))
}
export function spanTypeOfRange(range) {
  return spanTypeOfRangeType(range.constructor) ??
    spanTypeOfCursor(range.begin?.())
}

// span_range_t<R>
export function* spansOfRange(range) {
  assert(range != null, 'Range is required.')

  if (typeof range.spans == 'function') {
    yield* range.spans()
    return
  }

  assert(typeof range.span == 'function',
    'Range must expose span() or spans().')
  yield range.span()
}

// ____________________________________________________________________________
// CURSOR PROJECTIONS

// span_type_t<I>
export function spanTypeOfCursorType(type) {
  return type?.spanType
}
export function spanTypeOfCursor(cursor) {
  return cursor?.spanType
}
