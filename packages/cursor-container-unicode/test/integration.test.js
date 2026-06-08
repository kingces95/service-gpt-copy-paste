import { describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  Utf16CodePointContainer,
  Utf32CodePointContainer,
  Utf8CodePointContainer,
} from '../index.js'
import {
  encodeUtf16Bytes,
  encodeUtf16Sequence,
  encodeUtf32Bytes,
} from '@kingjs/unicode'

const Line = 'hello 😀 world\n'
const Text = `${Line}next`
const LineFeed = '\n'.codePointAt()
const CodePoints = [...Text].map(char => char.codePointAt())
const BeforeLineEnd = CodePoints.indexOf(LineFeed) + 1
const FirstChunkCount = 6
const FirstCodePoints = CodePoints.slice(0, FirstChunkCount)
const CommittedCodePoints = CodePoints.slice(0, BeforeLineEnd)
const RemainingCodePoints = CodePoints.slice(BeforeLineEnd)
const BigEndian = { options: { byteOrder: 'big' } }
const LittleEndian = { options: { byteOrder: 'little' } }
const Utf8Strings = { hasStrings: true }

function rangeOf(values) {
  return new TypedArrayView(values)
}

function chunk(values, count = FirstChunkCount) {
  return [
    values.subarray(0, count),
    values.subarray(count),
  ]
}

function encodeUtf8(values) {
  return [...Buffer.from(String.fromCodePoint(...values), 'utf8')]
}

function encodeUtf16Units(values) {
  return encodeUtf16Sequence(values)
}

function encodeUtf16BE(values) {
  return encodeUtf16Bytes(values, 'big')
}

function encodeUtf16LE(values) {
  return encodeUtf16Bytes(values, 'little')
}

function encodeUtf32BE(values) {
  return encodeUtf32Bytes(values, 'big')
}

function encodeUtf32LE(values) {
  return encodeUtf32Bytes(values, 'little')
}

function same(values) {
  return values
}

function encoding(name, Type, encodeBytes, encodeUnits, {
  options = { },
  hasStrings = false,
} = { }) {
  return {
    name,
    Type,
    options,
    sourceBytes: Uint8Array.from(encodeBytes(CodePoints)),
    firstCodePoints: FirstCodePoints,
    committedSourceUnits: encodeUnits(CommittedCodePoints),
    committedSourceBytes: encodeBytes(CommittedCodePoints),
    committedCodePoints: CommittedCodePoints,
    remainingCodePoints: RemainingCodePoints,
    split: encodeBytes(FirstCodePoints).length,
    hasStrings,
  }
}

function findLineEnd(input) {
  const cursor = input.begin()
  const end = input.end()

  while (!cursor.equals(end)) {
    if (cursor.value == LineFeed) {
      cursor.step()
      return cursor
    }

    cursor.step()
  }

  return null
}

const Encodings = [
  encoding('UTF-8',
    Utf8CodePointContainer, encodeUtf8, encodeUtf8, Utf8Strings),
  encoding('UTF-16BE',
    Utf16CodePointContainer, encodeUtf16BE, encodeUtf16Units, BigEndian),
  encoding('UTF-16LE',
    Utf16CodePointContainer, encodeUtf16LE, encodeUtf16Units, LittleEndian),
  encoding('UTF-32BE',
    Utf32CodePointContainer, encodeUtf32BE, same, BigEndian),
  encoding('UTF-32LE',
    Utf32CodePointContainer, encodeUtf32LE, same, LittleEndian),
]

describe('Code point container integration', () => {
  it.each(Encodings)(
    '$name buffers source chunks until a line can be committed',
  ({
    Type,
    options = { },
    sourceBytes,
    firstCodePoints,
    committedSourceUnits,
    committedSourceBytes,
    committedCodePoints,
    remainingCodePoints,
    split,
    hasStrings,
  }) => {
    const input = new Type(options)
    const [first, second] = chunk(sourceBytes, split)

    input.pushRange(rangeOf(first))

    expect(findLineEnd(input)).toBe(null)
    expect(valuesOf(input)).toEqual(firstCodePoints)

    input.pushRange(rangeOf(second))

    const lineEnd = findLineEnd(input)
    const committed = input.split(lineEnd)

    expect(valuesOf(committed)).toEqual(committedCodePoints)
    expect(valuesOf(committed.source$)).toEqual(committedSourceUnits)
    expect(valuesOf(deepestSourceOf(committed)))
      .toEqual(committedSourceBytes)

    if (hasStrings) {
      expect([...committed.toStrings()].join('')).toBe(Line)
      expect(committed.toString()).toBe(Line)
    }

    expect(valuesOf(input)).toEqual(remainingCodePoints)
  })
})

function valuesOf(range) {
  return [...iterate(range)]
}

function deepestSourceOf(range) {
  while (range.source$)
    range = range.source$

  return range
}
