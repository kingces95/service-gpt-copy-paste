import { assert } from '@kingjs/assert'
import { Buffer } from 'node:buffer'
import {
  distance,
  iterate,
} from '@kingjs/cursor-algorithm'
import {
  ReadableRangeShape,
  SpanProjectedRangeShape,
  VirtualRangeShape,
  spansOfRange,
} from '@kingjs/cursor-shape'
import { overload } from '@kingjs/function-contract'
import {
  AnyObject,
  AnyOf,
  OptionalOf,
} from '@kingjs/simple-type'
import { SizedIterableProbe } from '@kingjs/probe'

export const findSequence = overload([
  AnyOf(ReadableRangeShape, SpanProjectedRangeShape, VirtualRangeShape),
  AnyOf(SizedIterableProbe, ReadableRangeShape, VirtualRangeShape),
  OptionalOf(AnyObject),
], [
  {
    where: hasContainerFindSequence,
    use: callContainerFindSequence,
  },
  {
    where: canFindByteSequence,
    use: findByteSequence,
  },
],
function findSequence(range, sequence, { from = range.begin() } = { }) {
  assert(sequence != null, 'Sequence is required.')

  if (isEmptySequence(sequence))
    return { begin: from.clone(), end: from.clone() }

  return findSequenceByCursor(range, sequence, { from })
})

function hasContainerFindSequence(range) {
  return typeof range.findSequence == 'function'
}

function callContainerFindSequence(
  range,
  sequence,
  options,
) {
  return range.findSequence(sequence, options)
}

export function findSequenceByCursor(
  range,
  sequence,
  { from = range.begin(), until = range.end() } = { }
) {
  const candidate = from.clone()

  while (!candidate.equals(until)) {
    const matchEnd = matchAt(range, candidate, sequence)
    if (matchEnd)
      return { begin: candidate.clone(), end: matchEnd }

    candidate.step()
  }

  return null
}

function canFindByteSequence(range, sequence, { from = range.begin() } = { }) {
  if (!isByteSequence(sequence))
    return false

  if (!from.equals(range.begin()))
    return false

  try {
    for (const { span } of byteSpanDescriptorsOf(range))
      return span instanceof Uint8Array
  }
  catch {
    return false
  }

  return false
}

function findByteSequence(range, sequence, { from = range.begin() } = { }) {
  const needle = Buffer.from([...valuesOfSequence(sequence)])

  for (const { span, cursorAt } of byteSpanDescriptorsOf(range)) {
    assert(span instanceof Uint8Array,
      'Byte sequence search requires Uint8Array spans.')

    const index = Buffer
      .from(span.buffer, span.byteOffset, span.byteLength)
      .indexOf(needle)

    if (index >= 0)
      return {
        begin: cursorAt(index),
        end: cursorAt(index + needle.length),
      }

    const tailStart = Math.max(0, span.length - needle.length + 1)
    const match = findSequenceByCursor(range, sequence, {
      from: cursorAt(tailStart),
      until: cursorAt(span.length),
    })

    if (match)
      return match
  }

  return null
}

function* byteSpanDescriptorsOf(range) {
  yield* spansOfRange(range)
}

function isByteSequence(sequence) {
  for (const value of valuesOfSequence(sequence))
    if (!Number.isInteger(value) || value < 0 || value > 0xff)
      return false

  return true
}

function isEmptySequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return sequence.begin().equals(sequence.end())

  return sequence.length == 0
}

function valuesOfSequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return iterate(sequence)

  return sequence
}

export function lengthOfSequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return distance(sequence)

  return sequence.length
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
