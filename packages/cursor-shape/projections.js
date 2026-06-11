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
  return spanTypeOfCursorType(cursorTypeOfRangeType(type)) ??
    type?.spanType
}
export function spanTypeOfRange(range) {
  return spanTypeOfCursorType(cursorTypeOf(range)) ??
    spanTypeOfRangeType(range.constructor)
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
  const span = range.span()

  yield {
    span,
    cursorAt(offset) {
      return cursorAtOffset(range, offset)
    },
  }
}

function cursorAtOffset(range, offset) {
  const cursor = range.begin()

  for (let i = 0; i < offset; i++)
    cursor.step()

  return cursor
}

// ____________________________________________________________________________
// CURSOR PROJECTIONS

// span_type_t<I>
export function spanTypeOfCursorType(type) {
  return type?.spanType
}
