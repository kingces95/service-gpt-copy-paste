import { describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import {
  Uint16Vector,
  Uint32Vector,
  Uint8Vector,
} from '@kingjs/cursor-container-standard'
import {
  Utf16CodePointContainer,
  Utf32CodePointContainer,
  Utf8CodePointContainer,
} from '../index.js'
import {
  encodeUtf16Sequence,
} from '@kingjs/unicode'

const Line = 'hello 😀 world\n'
const Text = `${Line}next`
const LineFeed = '\n'.codePointAt()
const CodePoints = [...Text].map(char => char.codePointAt())
const BeforeLineEnd = CodePoints.indexOf(LineFeed) + 1
const FirstChunkCount = 6

function rangeOf(Type, values) {
  const result = new Type()
  result.assignRange(new SnapshotView(values))
  return result
}

function chunk(values, count = FirstChunkCount) {
  return [
    values.slice(0, count),
    values.slice(count),
  ]
}

function encodeUtf8(values) {
  return [...Buffer.from(String.fromCodePoint(...values), 'utf8')]
}

function encodeUtf16(values) {
  return encodeUtf16Sequence(values)
}

function encodeUtf32(values) {
  return values
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
  {
    name: 'UTF-8',
    Type: Utf8CodePointContainer,
    Vector: Uint8Vector,
    sourceUnits: encodeUtf8(CodePoints),
    firstCodePoints: CodePoints.slice(0, FirstChunkCount),
    committedSourceUnits: encodeUtf8(CodePoints.slice(0, BeforeLineEnd)),
    committedCodePoints: CodePoints.slice(0, BeforeLineEnd),
    remainingCodePoints: CodePoints.slice(BeforeLineEnd),
    split: encodeUtf8(CodePoints.slice(0, FirstChunkCount)).length,
    hasStrings: true,
  },
  {
    name: 'UTF-16',
    Type: Utf16CodePointContainer,
    Vector: Uint16Vector,
    sourceUnits: encodeUtf16(CodePoints),
    firstCodePoints: CodePoints.slice(0, FirstChunkCount),
    committedSourceUnits: encodeUtf16(CodePoints.slice(0, BeforeLineEnd)),
    committedCodePoints: CodePoints.slice(0, BeforeLineEnd),
    remainingCodePoints: CodePoints.slice(BeforeLineEnd),
    split: encodeUtf16(CodePoints.slice(0, FirstChunkCount)).length,
  },
  {
    name: 'UTF-32',
    Type: Utf32CodePointContainer,
    Vector: Uint32Vector,
    sourceUnits: encodeUtf32(CodePoints),
    firstCodePoints: CodePoints.slice(0, FirstChunkCount),
    committedSourceUnits: encodeUtf32(CodePoints.slice(0, BeforeLineEnd)),
    committedCodePoints: CodePoints.slice(0, BeforeLineEnd),
    remainingCodePoints: CodePoints.slice(BeforeLineEnd),
    split: encodeUtf32(CodePoints.slice(0, FirstChunkCount)).length,
  },
]

describe('Code point container integration', () => {
  it.each(Encodings)(
    '$name buffers source chunks until a line can be committed',
  ({
    Type,
    Vector,
    sourceUnits,
    firstCodePoints,
    committedSourceUnits,
    committedCodePoints,
    remainingCodePoints,
    split,
    hasStrings,
  }) => {
    const input = new Type()
    const [first, second] = chunk(sourceUnits, split)

    input.pushRange(rangeOf(Vector, first))

    expect(findLineEnd(input)).toBe(null)
    expect(valuesOf(input)).toEqual(firstCodePoints)

    input.pushRange(rangeOf(Vector, second))

    const lineEnd = findLineEnd(input)
    const committed = input.split(lineEnd)

    expect(valuesOf(committed)).toEqual(committedCodePoints)
    expect(valuesOf(committed.source)).toEqual(committedSourceUnits)

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
