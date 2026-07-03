import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import {
  encodeUtf16Bytes,
  encodeUtf16Sequence,
  encodeUtf32Bytes,
} from '@kingjs/unicode'
import {
  Utf16BECodeUnitContainer,
  Utf16LECodeUnitContainer,
  Utf32LECodeUnitContainer,
} from '../index.js'

function bytesOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

function codePointOf(text) {
  return text.codePointAt()
}

describe('UTF-16 code unit containers', () => {
  it('decodes big-endian source bytes to UTF-16 code units', () => {
    const input = new Utf16BECodeUnitContainer()
    const units = encodeUtf16Sequence([codePointOf('😀')])

    input.pushRange(bytesOf(
      encodeUtf16Bytes([codePointOf('😀')])
    ))

    expect([...iterate(input)]).toEqual(units)
  })

  it('returns committed source bytes', () => {
    const input = new Utf16LECodeUnitContainer()
    const bytes = encodeUtf16Bytes([...'ab'].map(codePointOf), 'little')

    input.pushRange(bytesOf(bytes))

    const cursor = input.begin()
    cursor.step()

    const committed = input.popRangeAt(cursor)

    expect([...iterate(committed)]).toEqual(bytes.slice(0, 2))
    expect([...iterate(input)]).toEqual([codePointOf('b')])
  })

  it('materializes strings using byte-width encoding defaults', () => {
    const input = new Utf16BECodeUnitContainer()

    input.pushRange(bytesOf(encodeUtf16Bytes(
      [...'hi'].map(codePointOf), 'big')))

    expect(input.toString()).toBe('hi')
  })
})

describe('UTF-32 code unit containers', () => {
  it('decodes little-endian source bytes to UTF-32 code units', () => {
    const input = new Utf32LECodeUnitContainer()
    const value = codePointOf('😀')

    input.pushRange(bytesOf(encodeUtf32Bytes([value], 'little')))

    expect([...iterate(input)]).toEqual([value])
  })

  it('rejects string materialization on demand', () => {
    const input = new Utf32LECodeUnitContainer()

    input.pushRange(bytesOf(encodeUtf32Bytes([codePointOf('a')], 'little')))

    expect(() => input.toString())
      .toThrow('UTF-32 string materialization is not supported.')
  })
})
