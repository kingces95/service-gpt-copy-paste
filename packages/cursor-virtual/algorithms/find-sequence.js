import { assert } from '@kingjs/assert'
import { Buffer } from 'node:buffer'
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
import { VirtualContainer } from '../container/virtual-container.js'

export const findSequence = overload([
  AnyOf(ReadableRangeShape, SpanProjectedRangeShape, VirtualRangeShape),
  AnyOf(SizedIterableProbe, ReadableRangeShape, VirtualRangeShape),
  OptionalOf(AnyObject),
], {
  precondition: assertVirtualSequenceType,
}, [
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
  return range instanceof VirtualContainer
}

function assertVirtualSequenceType(range, sequence) {
  const virtualRange = range instanceof VirtualContainer
  const virtualSequence = sequence instanceof VirtualContainer

  assert(virtualRange == virtualSequence,
    'Virtual sequence must match virtual range.')

  if (!virtualRange)
    return

  assert(sequence.constructor == range.constructor,
    'Virtual sequence type must match range type.')
}

function findVirtualSequence(range, sequence, { from = range.begin() } = { }) {
  const lowerSequence = [
    ...iterate(sequence.begin().materialize(sequence.end())),
  ]

  for (const page of from.pages(range.end())) {
    const pageMatch = findSequence(page, lowerSequence)
    const match = pageMatch && mapPageMatch(pageMatch)

    if (match)
      return match

    const virtualEnd = page.end().virtualize()
    const virtualBegin = fallbackBeginOfPage(
      page,
      sequence,
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

function fallbackBeginOfPage(page, sequence) {
  const virtualBegin = page.begin().virtualize()
  const virtualEnd = page.end().virtualize()
  const tailLength = lengthOfSequence(sequence) - 1

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
    cursor = previous(cursor)

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

function mapPageMatch(match) {
  if (!isSynchronizedInterval(match.begin, match.end))
    return null

  const begin = match.begin.virtualize()
  const end = match.end.virtualize()

  return { begin, end }
}

function isSynchronizedInterval(begin, end) {
  return begin.isSynchronized() && end.isSynchronized()
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
