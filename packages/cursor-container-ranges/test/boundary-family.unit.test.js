import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import { Uint8Vector } from '@kingjs/cursor-container-standard'
import { define } from '@kingjs/partial-define'
import {
  FixedProjectedRangeContainer,
  RangeContainer,
  VariableProjectedRangeContainer,
} from '../index.js'

function rangeOf(values) {
  const result = new Uint8Vector()
  result.assignRange(new SnapshotView(values))
  return result
}

function cursorAt(range, offset) {
  const cursor = range.begin()
  for (let i = 0; i < offset; i++)
    cursor.step()

  return cursor
}

class FixedValueRange extends FixedProjectedRangeContainer {
  constructor() {
    super(new RangeContainer(), { fixedStride: 2 })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor) {
        const first = sourceCursor.value
        sourceCursor.step()
        return [first, sourceCursor.value]
      },
    })
  }
}

class VariableValueRange extends VariableProjectedRangeContainer {
  constructor() {
    super(new RangeContainer(), {
      isContinuation: value => value == 2,
      continuationCountOf(value) {
        if (value == 1) return 1
        return 0
      },
    })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor, stride) {
        const values = []
        for (let i = 0; i < stride; i++) {
          values.push(sourceCursor.value)
          sourceCursor.step()
        }

        return values
      },
    })
  }
}

describe('FixedProjectedRangeContainer', () => {
  it('trims fixed-width suffixes to token boundaries', () => {
    const range = new FixedValueRange()

    range.pushRange(rangeOf([0, 1, 2, 3, 4]))

    expect(range.end().sourceCursor.equals(cursorAt(range.source, 4)))
      .toBe(true)
    expect([...iterate(range)]).toEqual([[0, 1], [2, 3]])
  })
})

describe('VariableProjectedRangeContainer', () => {
  it('trims incomplete continuation suffixes to token boundaries', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([0, 1]))

    expect(range.end().sourceCursor.equals(cursorAt(range.source, 1)))
      .toBe(true)
    expect([...iterate(range)]).toEqual([[0]])
  })

  it('rejects continuation-only suffixes', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([2]))

    expect(() => range.end()).toThrow('Invalid continuation value.')
  })
})
