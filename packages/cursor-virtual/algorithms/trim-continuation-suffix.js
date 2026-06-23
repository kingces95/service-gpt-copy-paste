import { assert } from '@kingjs/assert'
import { distance } from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'

export function trimContinuationSuffix(range, cursor, {
  isContinuation,
  continuationCountOf,
}) {
  const boundary = cursor.clone()
  const begin = range.begin()

  if (boundary.equals(begin))
    return boundary

  const starter = suffixStartOf(range, boundary, isContinuation)
  if (starter.equals(boundary))
    return boundary

  const available = distance(subrange(starter, boundary))
  const expected = 1 + continuationCountOf(starter.value)

  assert(available <= expected, 'Invalid continuation value.')

  return available < expected ? starter : boundary
}

function suffixStartOf(range, cursor, isContinuation) {
  const begin = range.begin()
  const starter = cursor.clone()

  do {
    starter.stepBack()
    if (!isContinuation(starter.value))
      break
  } while (!starter.equals(begin))

  assert(!isContinuation(starter.value), 'Invalid continuation value.')

  return starter
}
