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
  spansOfRange,
} from '@kingjs/cursor-shape'
import { overload } from '@kingjs/function-contract'
import {
  AnyObject,
  AnyOf,
  OptionalOf,
} from '@kingjs/simple-type'
import { SizedIterableProbe } from '@kingjs/probe'
import { ProjectedRangeContainer } from '../container/projected-range-container.js'
import { VirtualContainer } from '../container/virtual-container.js'

export const findSequence = overload([
  AnyOf(ReadableRangeShape, SpanProjectedRangeShape, VirtualRangeShape),
  AnyOf(SizedIterableProbe, ReadableRangeShape, VirtualRangeShape),
  OptionalOf(AnyObject),
], {
  precondition: assertProjectedSequenceType,
}, [
  {
    where: canFindProjectedSequence,
    use: findProjectedSequence,
  },
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

function canFindProjectedSequence(range) {
  return range instanceof ProjectedRangeContainer
}

function assertProjectedSequenceType(range, sequence) {
  const projectedRange = range instanceof ProjectedRangeContainer
  const projectedSequence = sequence instanceof ProjectedRangeContainer

  assert(projectedRange == projectedSequence,
    'Projected sequence must match projected range.')

  if (!projectedRange)
    return

  assert(sequence.constructor == range.constructor,
    'Projected sequence type must match range type.')
}

function findProjectedSequence(range, sequence, { from = range.begin() } = { }) {
  const projector = range.projector
  const sourceNeedle = materializeProjectedSequence(sequence)
  let sourceFrom = projector.sourceCursorOf(from)

  while (true) {
    const sourceMatch = findSequence(range.source, sourceNeedle, {
      from: sourceFrom,
    })

    if (!sourceMatch)
      return null

    if (isSynchronizedInterval(projector, sourceMatch.begin, sourceMatch.end))
      return {
        begin: projector.projectCursor(sourceMatch.begin),
        end: projector.projectCursor(sourceMatch.end),
      }

    sourceFrom = sourceMatch.begin.clone()
    sourceFrom.step()

    if (sourceFrom.equals(range.source.end()))
      return null
  }
}

function materializeProjectedSequence(sequence) {
  const projector = sequence.projector
  return sequence.source.materialize(
    projector.sourceCursorOf(sequence.begin()),
    projector.sourceCursorOf(sequence.end())
  )
}

function canFindVirtualSequence(range) {
  return range instanceof VirtualContainer
}

function findVirtualSequence(range, sequence, { from = range.begin() } = { }) {
  for (const page of range.pages(from, range.end())) {
    const pageMatch = findSequence(page, sequence)
    const match = pageMatch && virtualizeMatch(page, pageMatch)

    if (match)
      return match

    const virtualBegin = fallbackBeginOfPage(page, sequence)
    const virtualEnd = page.virtualize(page.end())

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
  const virtualBegin = page.virtualize(page.begin())
  const virtualEnd = page.virtualize(page.end())
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

function virtualizeMatch(page, match) {
  const begin = page.virtualize(match.begin)
  const end = page.virtualize(match.end)

  return begin && end ? { begin, end } : null
}

function isSynchronizedInterval(projector, begin, end) {
  return projector.isSynchronized(begin) &&
    projector.isSynchronized(end)
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
