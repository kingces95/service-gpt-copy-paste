import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import {
  Uint8Vector,
} from '@kingjs/cursor-container-standard'
import {
  encodeUtf16Bytes,
  encodeUtf16Sequence,
  encodeUtf32Bytes,
} from '@kingjs/unicode'
import {
  Utf16CodeUnitContainer,
  Utf32CodeUnitContainer,
} from '../index.js'

function rangeOf(Type, values) {
  const result = new Type()
  result.assignRange(new SnapshotView(values))
  return result
}

function codePointOf(text) {
  return text.codePointAt()
}

describe('Utf16CodeUnitContainer', () => {
  it('decodes ordered source bytes to UTF-16 code units', () => {
    const input = new Utf16CodeUnitContainer({ byteOrder: 'big' })
    const units = encodeUtf16Sequence([codePointOf('😀')])

    input.pushRange(rangeOf(
      Uint8Vector,
      encodeUtf16Bytes([codePointOf('😀')])
    ))

    expect([...iterate(input)]).toEqual(units)
  })

  it('returns committed source bytes', () => {
    const input = new Utf16CodeUnitContainer({ byteOrder: 'little' })
    const bytes = encodeUtf16Bytes([...'ab'].map(codePointOf), 'little')

    input.pushRange(rangeOf(Uint8Vector, bytes))

    const cursor = input.begin()
    cursor.step()

    const committed = input.popRange(cursor)

    expect([...iterate(committed)]).toEqual(bytes.slice(0, 2))
    expect([...iterate(input)]).toEqual([codePointOf('b')])
  })
})

describe('Utf32CodeUnitContainer', () => {
  it('decodes ordered source bytes to UTF-32 code units', () => {
    const input = new Utf32CodeUnitContainer({ byteOrder: 'little' })
    const value = codePointOf('😀')

    input.pushRange(rangeOf(Uint8Vector, encodeUtf32Bytes([value], 'little')))

    expect([...iterate(input)]).toEqual([value])
  })
})
