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
  Utf16CodeUnitContainer,
  Utf16LECodeUnitContainer,
  Utf32LECodeUnitContainer,
  Utf32CodeUnitContainer,
} from '../index.js'

function bytesOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

function codePointOf(text) {
  return text.codePointAt()
}

describe('Utf16CodeUnitContainer', () => {
  it('detects and consumes a UTF-16 byte order mark', () => {
    const input = new Utf16CodeUnitContainer()
    const units = encodeUtf16Sequence([codePointOf('😀')])

    input.pushRange(bytesOf(
      [0xff, 0xfe, ...encodeUtf16Bytes([codePointOf('😀')], 'little')]
    ))

    expect([...iterate(input)]).toEqual(units)
  })

  it('decodes ordered source bytes to UTF-16 code units', () => {
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
})

describe('Utf32CodeUnitContainer', () => {
  it('detects and consumes a UTF-32 byte order mark', () => {
    const input = new Utf32CodeUnitContainer()
    const value = codePointOf('😀')

    input.pushRange(bytesOf(
      [0x00, 0x00, 0xfe, 0xff, ...encodeUtf32Bytes([value], 'big')]
    ))

    expect([...iterate(input)]).toEqual([value])
  })

  it('decodes ordered source bytes to UTF-32 code units', () => {
    const input = new Utf32LECodeUnitContainer()
    const value = codePointOf('😀')

    input.pushRange(bytesOf(encodeUtf32Bytes([value], 'little')))

    expect([...iterate(input)]).toEqual([value])
  })
})
