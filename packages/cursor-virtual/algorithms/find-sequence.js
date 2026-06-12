import { assert } from '@kingjs/assert'
import { Buffer } from 'node:buffer'
import { subrange } from '@kingjs/cursor-view'
import {
  distance,
  iterate,
  previous,
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
    where: canFindVirtualSequence,
    use: findVirtualSequence,
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

function canFindVirtualSequence(range) {
  return range instanceof VirtualRangeShape
}

function findVirtualSequence(range, sequence, { from = range.begin() } = { }) {
  const materializedNeedle = sequence instanceof VirtualRangeShape
  const lowerSequence = materializedNeedle
    ? [...iterate(sequence.begin().materialize(sequence.end()))]
    : sequence

  for (const descriptor of from.pages(range.end())) {
    const { begin: pageBegin, end: pageEnd } = descriptor
    const page = subrange(pageBegin, pageEnd)
    const pageMatch = findSequence(page, lowerSequence)
    const match = pageMatch &&
      mapPageMatch(page, pageMatch, descriptor)

    if (match)
      return match

    const pageLength = distance(page)
    const virtualEnd = virtualizePageOffset(descriptor, pageLength)
    const virtualBegin = fallbackBeginOfPage(
      descriptor,
      pageLength,
      sequence,
      { materializedNeedle }
    )

    if (!virtualBegin || !virtualEnd)
      continue

    const virtualMatch = findSequenceByCursor(range, sequence, {
      from: virtualBegin,
      until: virtualEnd,
    })

    if (virtualMatch)
      return virtualMatch
  }

  return null
}

function fallbackBeginOfPage(
  descriptor,
  pageLength,
  sequence,
  { materializedNeedle }
) {
  const virtualBegin = virtualizePageOffset(descriptor, 0)
  const virtualEnd = virtualizePageOffset(descriptor, pageLength)
  const tailLength = lengthOfSequence(sequence) - 1

  if (!materializedNeedle)
    return virtualBegin

  if (tailLength <= 0)
    return null

  if (!virtualBegin || !virtualEnd)
    return null

  if (typeof virtualEnd.stepBack != 'function')
    return virtualBegin

  return previousBounded(virtualEnd, tailLength, virtualBegin)
}

function previousBounded(cursor, count, begin) {
  cursor = cursor.clone()

  for (let i = 0; i < count && !cursor.equals(begin); i++)
    previous(cursor)

  return cursor
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

function mapPageMatch(page, match, descriptor) {
  const beginOffset = offsetOf(page, match.begin)
  const endOffset = offsetOf(page, match.end)

  if (!isSynchronizedInterval(descriptor, beginOffset, endOffset))
    return null

  const begin = virtualizePageOffset(descriptor, beginOffset)
  const end = virtualizePageOffset(descriptor, endOffset)

  return { begin, end }
}

function isSynchronizedInterval(descriptor, beginOffset, endOffset) {
  return isSynchronizedPageOffset(descriptor, beginOffset) &&
    isSynchronizedPageOffset(descriptor, endOffset)
}

function isSynchronizedPageOffset(descriptor, offset) {
  return descriptor.isSynchronized(offset)
}

function virtualizePageOffset(descriptor, offset) {
  return descriptor.virtualize(offset)
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

function lengthOfSequence(sequence) {
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
