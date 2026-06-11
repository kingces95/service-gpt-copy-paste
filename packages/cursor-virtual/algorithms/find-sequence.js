import { assert } from '@kingjs/assert'
import { Buffer } from 'node:buffer'
import {
  iterate,
} from '@kingjs/cursor-algorithm'
import {
  ReadableRangeShape,
  SpanProjectedRangeShape,
  VirtualRangeShape,
  spanTypeOfRange,
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
    where: canFindByteSequence,
    use: findByteSequence,
  },
  {
    where: canFindVirtualSequence,
    use: findVirtualSequence,
  },
],
function findSequence(range, sequence, { from = range.begin() } = { }) {
  assert(sequence != null, 'Sequence is required.')

  if (isEmptySequence(sequence))
    return { begin: from.clone(), end: from.clone() }

  return findSequenceByCursor(range, sequence, { from })
})

function canFindVirtualSequence(range) {
  return range instanceof VirtualRangeShape
}

function findVirtualSequence(range, sequence, { from = range.begin() } = { }) {
  const lowerSequence = sequence instanceof VirtualRangeShape
    ? [...iterate(sequence.begin().materialize(sequence.end()))]
    : sequence

  for (const { range: page, cursorAt } of from.pages(range.end())) {
    const match = findSequence(page, lowerSequence)
    if (!match)
      continue

    const begin = offsetOf(page, match.begin)
    const end = offsetOf(page, match.end)
    return {
      begin: cursorAt(begin),
      end: cursorAt(end),
    }
  }

  return findSequenceByCursor(range, sequence, { from })
}

function findSequenceByCursor(
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

function offsetOf(range, cursor) {
  const current = range.begin()
  let offset = 0

  while (!current.equals(cursor)) {
    current.step()
    offset++
  }

  return offset
}

function canFindByteSequence(range, sequence, { from = range.begin() } = { }) {
  if (spanTypeOfRange(range) != Uint8Array)
    return false

  if (sequence instanceof VirtualRangeShape)
    return false

  if (!isByteSequence(sequence))
    return false

  if (!from.equals(range.begin()))
    return false

  return true
}

function findByteSequence(range, sequence, { from = range.begin() } = { }) {
  const needle = Buffer.from([...valuesOfSequence(sequence)])

  for (const { span, cursorAt } of spansOfRange(range)) {
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
