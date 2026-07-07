import { describe, expect, it } from 'vitest'
import {
  assertScalarValue,
  decodeSurrogatePair,
  isHighSurrogate,
  isLowSurrogate,
  isScalarValue,
  isSurrogate,
  UnicodeEncoding,
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
})

describe('Unicode string encoding', () => {
  it('normalizes encoding names once', () => {
    expect(UnicodeEncoding.from('utf8').name).toBe('utf-8')
    expect(UnicodeEncoding.from('ucs2').name).toBe('utf-16le')
    expect(UnicodeEncoding.from('utf-16be').name).toBe('utf-16be')
  })

  it.each([
    ['utf-8'],
    ['utf-16le'],
    ['utf-16be'],
  ])('encodes and decodes strings as %s', encoding => {
    const text = 'alpha😀'
    const unicode = UnicodeEncoding.from(encoding)
    const bytes = unicode.encodeString(text)

    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(unicode.decodeBytes(bytes)).toBe(text)
  })

  it('decodes chunks across split code units', () => {
    const unicode = UnicodeEncoding.from('utf-16be')
    const bytes = unicode.encodeString('a😀b')
    const text = unicode.decodeChunks([
      bytes.subarray(0, 3),
      bytes.subarray(3, 6),
      bytes.subarray(6),
    ])

    expect(text).toBe('a😀b')
  })

  it('decodes a chunk without flushing a partial code point', () => {
    const unicode = UnicodeEncoding.from('utf-8')
    const bytes = unicode.encodeString('ab😀')

    expect(unicode.decodeChunk(bytes.subarray(0, 3))).toBe('ab')
  })

  it('reports byte width for counted reads', () => {
    expect(UnicodeEncoding.from('utf-8').countByteWidth).toBe(1)
    expect(UnicodeEncoding.from('utf-16le').countByteWidth).toBe(2)
    expect(UnicodeEncoding.from('utf-16be').countByteWidth).toBe(2)
  })

  it('reuses encoding instances passed to from', () => {
    const text = 'alpha😀'
    const unicode = UnicodeEncoding.from('utf-16be')
    const bytes = unicode.encodeString(text)

    expect(UnicodeEncoding.from(unicode)).toBe(unicode)
    expect(unicode.decodeBytes(bytes)).toBe(text)
    expect(unicode.decodeChunks([bytes.subarray(0, 3),
      bytes.subarray(3)])).toBe(text)
  })
})
