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
} from '@kingjs/simple-type'

export const findSequence = contract([
  ReadableRangeShape,
  AnyObject,
],
function findSequence(
  range,
  sequence,
) {
  assert(sequence != null, 'Sequence is required.')

  if (isEmptySequence(sequence)) {
    const begin = range.begin()
    return {
      begin: begin.clone(),
      end: begin.clone(),
    }
  }

  const candidate = range.begin()
  const until = range.end()

  while (!candidate.equals(until)) {
    const matchEnd = matchAt(range, candidate, sequence)
    if (matchEnd)
      return { begin: candidate.clone(), end: matchEnd }

    candidate.step()
  }

  return null
})

function matchAt(range, cursor, sequence) {
  const end = range.end()
  const current = cursor.clone()

  for (const value of valuesOf(sequence)) {
    if (current.equals(end))
      return null

    if (current.value != value)
      return null

    current.step()
  }

  return current
}

function isEmptySequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return sequence.begin().equals(sequence.end())

  if (typeof sequence.length == 'number')
    return sequence.length == 0

  assert(typeof sequence[Symbol.iterator] == 'function',
    'Sequence must be iterable.')

  return sequence[Symbol.iterator]().next().done
}

function valuesOf(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return iterate(sequence)

  assert(typeof sequence[Symbol.iterator] == 'function',
    'Sequence must be iterable.')

  return sequence
}
