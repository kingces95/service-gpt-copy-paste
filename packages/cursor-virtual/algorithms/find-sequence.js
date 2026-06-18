import { assert } from '@kingjs/assert'
import {
  distance,
  iterate,
} from '@kingjs/cursor-algorithm'
import {
  ReadableRangeShape,
} from '@kingjs/cursor-shape'

export function findSequence(
  range,
  sequence,
  { from = range.begin(), until = range.end() } = { },
) {
  assert(sequence != null, 'Sequence is required.')

  if (isEmptySequence(sequence))
    return { begin: from.clone(), end: from.clone() }

  if (typeof range.findSequence == 'function')
    return range.findSequence(sequence, { from, until })

  return findSequenceByCursor(range, sequence, { from, until })
}

function isEmptySequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return sequence.begin().equals(sequence.end())

  return sequence.length == 0
}

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

  for (const value of valuesOfSequence(sequence)) {
    if (current.equals(end))
      return null

    if (current.value != value)
      return null

    current.step()
  }

  return current
}

function valuesOfSequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return iterate(sequence)

  return sequence
}
