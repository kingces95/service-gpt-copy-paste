import { describe, expect, it } from 'vitest'
import {
  assertScalarValue,
  decodeSurrogatePair,
  decodeUtf8Sequence,
  encodeUtf16Bytes,
  encodeUtf16Sequence,
  encodeUtf32Bytes,
  isHighSurrogate,
  isLowSurrogate,
  isScalarValue,
  isSurrogate,
  utf16LastCodePointOffset,
  utf8LastCodePointOffset,
  utf8ContinuationCount,
} from './index.js'

describe('Unicode scalar values', () => {
  it('accepts scalar values', () => {
    expect(isScalarValue(0)).toBe(true)
    expect(isScalarValue(0x61)).toBe(true)
    expect(isScalarValue(0x1f600)).toBe(true)
    expect(isScalarValue(0x10ffff)).toBe(true)
  })

  it('rejects non-scalars', () => {
    expect(isScalarValue(-1)).toBe(false)
    expect(isScalarValue(0xd800)).toBe(false)
    expect(isScalarValue(0xdfff)).toBe(false)
    expect(isScalarValue(0x110000)).toBe(false)
    expect(isScalarValue(1.5)).toBe(false)

    expect(() => assertScalarValue(0xd800)).toThrow(
      'Unicode surrogate code point is invalid.')
  })
})

describe('UTF-16 surrogates', () => {
  it('classifies surrogate halves', () => {
    expect(isSurrogate(0xd83d)).toBe(true)
    expect(isHighSurrogate(0xd83d)).toBe(true)
    expect(isLowSurrogate(0xd83d)).toBe(false)

    expect(isSurrogate(0xde00)).toBe(true)
    expect(isHighSurrogate(0xde00)).toBe(false)
    expect(isLowSurrogate(0xde00)).toBe(true)
  })

  it('decodes a surrogate pair', () => {
    expect(decodeSurrogatePair(0xd83d, 0xde00)).toBe(0x1f600)
  })

  it('encodes scalar values to UTF-16 code units', () => {
    expect(encodeUtf16Sequence([0x61, 0x1f600]))
      .toEqual([0x61, 0xd83d, 0xde00])
  })

  it('encodes scalar values to bytes', () => {
    expect(encodeUtf16Bytes([0x61, 0x1f600]))
      .toEqual([0x00, 0x61, 0xd8, 0x3d, 0xde, 0x00])
    expect(encodeUtf32Bytes([0x61, 0x1f600]))
      .toEqual([0x00, 0x00, 0x00, 0x61, 0x00, 0x01, 0xf6, 0x00])
  })
})

describe('UTF-8 sequences', () => {
  it('classifies leading bytes by continuation count', () => {
    expect(utf8ContinuationCount(0x7f)).toBe(0)
    expect(utf8ContinuationCount(0xc2)).toBe(1)
    expect(utf8ContinuationCount(0xe0)).toBe(2)
    expect(utf8ContinuationCount(0xf0)).toBe(3)
  })

  it('decodes sequences to scalar values', () => {
    expect(decodeUtf8Sequence(0x61)).toBe(0x61)
    expect(decodeUtf8Sequence(0xc3, [0x29])).toBe(0xe9)
    expect(decodeUtf8Sequence(0xe2, [0x02, 0x2c])).toBe(0x20ac)
    expect(decodeUtf8Sequence(0xf0, [0x1f, 0x18, 0x00])).toBe(0x1f600)
  })

  it('rejects invalid or non-shortest forms', () => {
    expect(() => utf8ContinuationCount(0x80)).toThrow(
      'Invalid UTF-8 leading byte.')
    expect(() => decodeUtf8Sequence(0xc2, [])).toThrow(
      'Unexpected UTF-8 continuation count.')
    expect(() => decodeUtf8Sequence(0xe0, [0x00, 0x00])).toThrow(
      'Overlong UTF-8 sequence.')
  })

  it('finds the complete boundary in a suffix', () => {
    expect(utf8LastCodePointOffset([])).toBe(0)
    expect(utf8LastCodePointOffset([0x61])).toBe(1)
    expect(utf8LastCodePointOffset([0xf0])).toBe(null)
    expect(utf8LastCodePointOffset([0xf0, 0x9f])).toBe(null)
    expect(utf8LastCodePointOffset([0x61, 0xf0, 0x9f])).toBe(1)
    expect(utf8LastCodePointOffset([0xf0, 0x9f, 0x98, 0x80]))
      .toBe(4)

    expect(() => utf8LastCodePointOffset([0x80])).toThrow(
      'Invalid UTF-8 continuation byte.')
  })
})

describe('UTF-16 suffixes', () => {
  it('finds the complete boundary in a suffix', () => {
    expect(utf16LastCodePointOffset([])).toBe(0)
    expect(utf16LastCodePointOffset([0x61])).toBe(1)
    expect(utf16LastCodePointOffset([0xd83d])).toBe(null)
    expect(utf16LastCodePointOffset([0x61, 0xd83d])).toBe(1)
    expect(utf16LastCodePointOffset([0xd83d, 0xde00])).toBe(2)

    expect(() => utf16LastCodePointOffset([0xde00])).toThrow(
      'Unexpected UTF-16 low surrogate.')
  })
})
