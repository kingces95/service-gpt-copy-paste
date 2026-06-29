import { describe, expect, it } from 'vitest'
import { Buffer } from 'node:buffer'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  encodeUtf16Bytes,
  encodeUtf16Sequence,
  encodeUtf32Bytes,
} from '@kingjs/unicode'
import {
  Utf16BECodePointContainer,
  Utf16BECodeUnitContainer,
  Utf16LECodePointContainer,
  Utf16LECodeUnitContainer,
  Utf32BECodePointContainer,
  Utf32BECodeUnitContainer,
  Utf32LECodePointContainer,
  Utf32LECodeUnitContainer,
  Utf8CodePointContainer,
} from '../index.js'

function bytesOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

function utf8Of(text) {
  return [...Buffer.from(text, 'utf8')]
}

function codePointOf(text) {
  return text.codePointAt()
}

function utf16Of(text) {
  return encodeUtf16Sequence([...text].map(codePointOf))
}

function utf16BytesOf(text, byteOrder = 'big') {
  return encodeUtf16Bytes([...text].map(codePointOf), byteOrder)
}

function utf32BytesOf(text, byteOrder = 'big') {
  return encodeUtf32Bytes([...text].map(codePointOf), byteOrder)
}

describe('Utf8CodePointContainer', () => {
  const A = codePointOf('a')
  const GrinningFace = codePointOf('😀')
  const LineFeed = codePointOf('\n')
  const GrinningFaceBytes = utf8Of('😀')

  it('scans code points before committing source bytes', () => {
    const input = new Utf8CodePointContainer()

    input
      .pushRange(bytesOf(GrinningFaceBytes.slice(0, 2)))
      .pushRange(bytesOf([
        ...GrinningFaceBytes.slice(2),
        ...utf8Of('\n'),
      ]))

    expect([...iterate(input)]).toEqual([GrinningFace, LineFeed])
    expect([...iterate(input)]).toEqual([GrinningFace, LineFeed])

    const commit = input.begin()
    commit.step()
    commit.step()

    const committed = input.splitAt(commit)
    expect(committed.toString()).toBe('😀\n')
    expect([...iterate(input)]).toEqual([])
  })

  it('streams committed UTF-8 byte ranges to string chunks', () => {
    const input = new Utf8CodePointContainer()

    input
      .pushRange(bytesOf(GrinningFaceBytes.slice(0, 2)))
      .pushRange(bytesOf(GrinningFaceBytes.slice(2)))

    const commit = input.begin()
    commit.step()

    const committed = input.splitAt(commit)

    expect([...committed.toStrings()]).toEqual(['😀'])
  })

  it('retains an incomplete trailing sequence', () => {
    const input = new Utf8CodePointContainer()

    input.pushRange(bytesOf(GrinningFaceBytes.slice(0, 2)))

    expect([...iterate(input)]).toEqual([])
    expect([...iterate(input.popRangeAt())]).toEqual([])

    input.pushRange(bytesOf(GrinningFaceBytes.slice(2)))

    expect([...iterate(input)]).toEqual([GrinningFace])
  })

  it('finds the complete end across one-byte ranges', () => {
    const input = new Utf8CodePointContainer()

    for (const byte of GrinningFaceBytes)
      input.pushRange(bytesOf([byte]))

    expect([...iterate(input)]).toEqual([GrinningFace])
    expect(input.end().sourceCursor$.equals(input.source$.end())).toBe(true)
  })

  it('excludes a dangling suffix across one-byte ranges', () => {
    const input = new Utf8CodePointContainer()

    for (const byte of [...utf8Of('a'), ...GrinningFaceBytes.slice(0, 2)])
      input.pushRange(bytesOf([byte]))

    expect([...iterate(input)]).toEqual([A])
    expect(input.end().sourceCursor$.value).toBe(GrinningFaceBytes[0])
  })

  it('rejects trailing continuation bytes without a matching lead', () => {
    const input = new Utf8CodePointContainer()

    input
      .pushRange(bytesOf(utf8Of('a')))
      .pushRange(bytesOf([GrinningFaceBytes[1]]))

    expect(() => input.end()).toThrow('Invalid continuation value.')
  })
})

describe('Utf16CodePointContainer', () => {
  const A = codePointOf('a')
  const GrinningFace = codePointOf('😀')
  const GrinningFaceUnits = utf16Of('😀')

  it('uses endian UTF-16 code unit sources', () => {
    expect(new Utf16BECodePointContainer().source$)
      .toBeInstanceOf(Utf16BECodeUnitContainer)
    expect(new Utf16LECodePointContainer().source$)
      .toBeInstanceOf(Utf16LECodeUnitContainer)
  })

  it('excludes a dangling high surrogate', () => {
    const input = new Utf16BECodePointContainer()

    input
      .pushRange(bytesOf(utf16BytesOf('a')))
      .pushRange(bytesOf(utf16BytesOf('😀').slice(0, 2)))

    expect([...iterate(input)]).toEqual([A])
    expect(input.end().sourceCursor$.value).toBe(GrinningFaceUnits[0])
  })

  it('finds the complete end across one-unit surrogate ranges', () => {
    const input = new Utf16LECodePointContainer()

    input
      .pushRange(bytesOf(utf16BytesOf('😀', 'little').slice(0, 2)))
      .pushRange(bytesOf(utf16BytesOf('😀', 'little').slice(2)))

    expect([...iterate(input)]).toEqual([GrinningFace])
    expect(input.end().sourceCursor$.equals(input.source$.end())).toBe(true)
  })
})

describe('Utf32CodePointContainer', () => {
  const A = codePointOf('a')
  const GrinningFace = codePointOf('😀')

  it('uses endian UTF-32 code unit sources', () => {
    expect(new Utf32BECodePointContainer().source$)
      .toBeInstanceOf(Utf32BECodeUnitContainer)
    expect(new Utf32LECodePointContainer().source$)
      .toBeInstanceOf(Utf32LECodeUnitContainer)
  })

  it('uses the source end as its complete end', () => {
    const input = new Utf32LECodePointContainer()

    input.pushRange(bytesOf(utf32BytesOf('a😀', 'little')))

    expect([...iterate(input)]).toEqual([A, GrinningFace])
    expect(input.end().sourceCursor$.equals(input.source$.end())).toBe(true)
  })

  it('does not support string materialization', () => {
    const input = new Utf32LECodePointContainer()
    const message = 'UTF-32 string materialization is not supported.'

    input.pushRange(bytesOf(utf32BytesOf('a', 'little')))

    expect(() => [...input.toStrings()]).toThrow(message)
    expect(() => input.toString()).toThrow(message)
  })
})
