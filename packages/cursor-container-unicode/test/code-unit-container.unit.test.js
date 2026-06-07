import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import {
  Uint16Vector,
  Uint32Vector,
} from '@kingjs/cursor-container-standard'
import {
  encodeUtf16Sequence,
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
  it('iterates native UTF-16 code units', () => {
    const input = new Utf16CodeUnitContainer()
    const units = encodeUtf16Sequence([codePointOf('😀')])

    input.pushRange(rangeOf(Uint16Vector, units))

    expect([...iterate(input)]).toEqual(units)
  })

  it('returns committed source code units', () => {
    const input = new Utf16CodeUnitContainer()
    const units = encodeUtf16Sequence([...'ab'].map(codePointOf))

    input.pushRange(rangeOf(Uint16Vector, units))

    const cursor = input.begin()
    cursor.step()

    const committed = input.popRange(cursor)

    expect([...iterate(committed)]).toEqual([codePointOf('a')])
    expect([...iterate(input)]).toEqual([codePointOf('b')])
  })
})

describe('Utf32CodeUnitContainer', () => {
  it('iterates native UTF-32 code units', () => {
    const input = new Utf32CodeUnitContainer()
    const value = codePointOf('😀')

    input.pushRange(rangeOf(Uint32Vector, [value]))

    expect([...iterate(input)]).toEqual([value])
  })
})
