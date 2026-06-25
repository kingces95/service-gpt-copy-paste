import { describe, expect, it } from 'vitest'
import { TypedArrayView } from '@kingjs/cursor-view'
import { iterate } from '@kingjs/cursor-algorithm'
import { compose } from '@kingjs/partial-compose'
import {
  VariableStrideProjectedRangeContainer,
  ProjectedRangePart,
  VirtualContainer,
} from '../index.js'

class UtfLikeRange extends VariableStrideProjectedRangeContainer {
  constructor({ throwOnFirst = false } = { }) {
    super(new VirtualContainer(), {
      isContinuation: value => value >= 0x80,
      continuationCountOf(value) {
        return value >= 0x40 ? 1 : 0
      },
    })
    this.throwOnFirst = throwOnFirst
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const first = sourceCursor.value
        if (this.throwOnFirst && first == 0x40)
          throw new Error('Fallback should start at the page tail.')

        const stride = this.tokenStrideOf$(first)

        for (let i = 1; i < stride; i++)
          sourceCursor.step()

        return first
      },
    })
  }
}

function rangeOf(...chunks) {
  const result = new UtfLikeRange()

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

function throwingRangeOf(...chunks) {
  const result = new UtfLikeRange({ throwOnFirst: true })

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('variable stride virtual cursor backtracking', () => {
  it('steps back to the previous starter value', () => {
    const range = rangeOf([0x40, 0x80, 0x41, 0x81])
    const cursor = range.end()

    cursor.stepBack()
    expect(cursor.value).toBe(0x41)

    cursor.stepBack()
    expect(cursor.value).toBe(0x40)
  })

  it('bounds cross-page fallback to the variable-stride page tail', () => {
    const haystack = throwingRangeOf(
      [0x40, 0x80, 0x41, 0x81],
      [0x42, 0x82]
    )
    const needle = rangeOf([0x41, 0x81, 0x42, 0x82])
    const committed = haystack.split(needle)

    expect(valuesOf(committed)).toEqual([0x40, 0x41, 0x42])
    expect(haystack.isEmpty).toBe(true)
  })
})
