import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import { Uint8Vector } from '@kingjs/cursor-container-standard'
import { define } from '@kingjs/partial-define'
import {
  FixedStrideRangeContainer,
  ProjectedRangeContainer,
  RangeContainer,
  VariableStrideRangeContainer,
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

const projectedSplit = ProjectedRangeContainer.prototype.split

class FixedValueRange extends FixedStrideRangeContainer {
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

class VariableValueRange extends VariableStrideRangeContainer {
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

class ConfiguredFixedValueRange extends FixedValueRange {
  configured = false

  static {
    define(this, {
      split(cursor = this.end(), result = null) {
        result ??= new this.constructor()
        result.configured = true
        return projectedSplit.call(this, cursor, result)
      },
    })
  }
}

describe('FixedStrideRangeContainer', () => {
  it('trims fixed-width suffixes to token boundaries', () => {
    const range = new FixedValueRange()

    range.pushRange(rangeOf([0, 1, 2, 3, 4]))

    expect(range.end().sourceCursor$.equals(cursorAt(range.source$, 4)))
      .toBe(true)
    expect([...iterate(range)]).toEqual([[0, 1], [2, 3]])
  })

  it('lets overrides configure split results before delegating', () => {
    const range = new ConfiguredFixedValueRange()

    range.pushRange(rangeOf([0, 1, 2, 3]))

    const cursor = range.begin()
    cursor.step()

    const committed = range.split(cursor)

    expect(committed).toBeInstanceOf(ConfiguredFixedValueRange)
    expect(committed.configured).toBe(true)
    expect([...iterate(committed)]).toEqual([[0, 1]])
    expect([...iterate(range)]).toEqual([[2, 3]])
  })

  it('rejects split cursors from another projected range', () => {
    const range = new FixedValueRange()
    const other = new FixedValueRange()

    range.pushRange(rangeOf([0, 1]))
    other.pushRange(rangeOf([2, 3]))

    expect(() => range.split(other.begin())).toThrow(
      'Cursor is from another container.')
  })
})

describe('VariableStrideRangeContainer', () => {
  it('trims incomplete continuation suffixes to token boundaries', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([0, 1]))

    expect(range.end().sourceCursor$.equals(cursorAt(range.source$, 1)))
      .toBe(true)
    expect([...iterate(range)]).toEqual([[0]])
  })

  it('rejects continuation-only suffixes', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([2]))

    expect(() => range.end()).toThrow('Invalid continuation value.')
  })
})
