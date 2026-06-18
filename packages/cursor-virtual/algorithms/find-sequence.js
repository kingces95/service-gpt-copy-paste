import { assert } from '@kingjs/assert'
import { contract } from '@kingjs/function-contract'
import {
  iterate,
} from '@kingjs/cursor-algorithm'
import {
  ReadableRangeShape,
} from '@kingjs/cursor-shape'
import {
  AnyObject,
  OptionalOf,
} from '@kingjs/simple-type'

export const findSequence = contract([
  ReadableRangeShape,
  ReadableRangeShape,
  OptionalOf(AnyObject),
],
function findSequence(
  range,
  sequence,
  { from = range.begin(), until = range.end() } = { },
) {
  assert(sequence != null, 'Sequence is required.')

  if (sequence.begin().equals(sequence.end()))
    return { begin: from.clone(), end: from.clone() }

  return findSequenceByCursor(range, sequence, { from, until })
})

function findSequenceByCursor(
  range,
  sequence,
  { from = range.begin(), until = range.end() } = { }
) {
  const candidate = from.clone()

  // "until" bounds candidate starts. A candidate that starts before until may
  // still match across it, which lets callers search page-tail windows.
  while (!candidate.equals(until)) {
    const matchEnd = matchAt(range, candidate, sequence)
    if (matchEnd)
      return { begin: candidate.clone(), end: matchEnd }

    candidate.step()
  }

  return null
}

function matchAt(range, cursor, sequence) {
  const end = range.end()
  const current = cursor.clone()

  for (const value of iterate(sequence)) {
    if (current.equals(end))
      return null

    if (current.value != value)
      return null

    current.step()
  }

  return current
}
