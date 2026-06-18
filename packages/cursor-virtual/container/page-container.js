import { Buffer } from 'node:buffer'
import {
  iterate,
} from '@kingjs/cursor-algorithm'
import {
  ReadableRangeShape,
} from '@kingjs/cursor-shape'

export class Page {
  _offset
  _range
  _virtualize

  constructor(range, {
    offset = 0,
    virtualize = null,
  } = { }) {
    this._offset = offset
    this._range = range
    this._virtualize = virtualize
  }

  get offset() { return this._offset }
  get range() { return this._range }
  get cursorType() { return this._range.cursorType }

  begin() { return this._range.begin() }
  end() { return this._range.end() }

  span(begin = this.begin(), end = this.end()) {
    return begin.span(end)
  }

  offsetOf(cursor) {
    let offset = 0
    const current = this.begin()

    while (!current.equals(cursor)) {
      current.step()
      offset++
    }

    return offset
  }

  virtualize(cursor) {
    return this._virtualize?.(cursor) ?? null
  }

  findSequence(sequence, {
    from = this.begin(),
    until = this.end(),
  } = { }) {
    if (!isByteSequence(sequence))
      return null

    const needle = Buffer.from([...valuesOfSequence(sequence)])
    const span = this.span(from, until)

    assertByteSpan(span)

    if (needle.length == 0)
      return { begin: from.clone(), end: from.clone() }

    const index = Buffer
      .from(span.buffer, span.byteOffset, span.byteLength)
      .indexOf(needle)

    if (index < 0)
      return null

    const offset = this.offsetOf(from) + index

    return {
      begin: cursorAt(this, offset),
      end: cursorAt(this, offset + needle.length),
    }
  }
}

export { Page as PageContainer }

function cursorAt(range, offset) {
  const cursor = range.begin()

  for (let i = 0; i < offset; i++)
    cursor.step()

  return cursor
}

function assertByteSpan(span) {
  if (span instanceof Uint8Array)
    return

  throw new Error('Byte sequence search requires Uint8Array spans.')
}

function isByteSequence(sequence) {
  for (const value of valuesOfSequence(sequence))
    if (!Number.isInteger(value) || value < 0 || value > 0xff)
      return false

  return true
}

function valuesOfSequence(sequence) {
  if (sequence instanceof ReadableRangeShape)
    return iterate(sequence)

  return sequence
}
