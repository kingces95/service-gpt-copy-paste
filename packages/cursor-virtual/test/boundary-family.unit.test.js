import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { define } from '@kingjs/partial-define'
import {
  FixedStrideProjectedRangeContainer,
  ProjectedRangeContainer,
  VirtualContainer,
  VariableStrideProjectedRangeContainer,
} from '../index.js'

function rangeOf(values) {
  return new TypedArrayView(Uint8Array.from(values))
}

function cursorAt(range, offset) {
  const cursor = range.begin()
  for (let i = 0; i < offset; i++)
    cursor.step()

  return cursor
}

const virtualSplitAt = ProjectedRangeContainer.prototype.splitAt

class FixedValueRange extends FixedStrideProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer(), { strideLength: 2 })
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

class VariableValueRange extends VariableStrideProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer(), {
      isContinuation: value => value == 2,
      continuationCountOf(value) {
        if (value == 1) return 1
        return 0
      },
    })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor) {
        const values = []
        const stride = this.tokenStrideOf$(sourceCursor.value)

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
      splitAt(cursor) {
        const result = virtualSplitAt.call(this, cursor)
        result.configured = true
        return result
      },
    })
  }
}

describe('FixedStrideProjectedRangeContainer', () => {
  it('trims fixed-width suffixes to token boundaries', () => {
    const range = new FixedValueRange()

    range.pushRange(rangeOf([0, 1, 2, 3, 4]))

    expect(range.end().sourceCursor$.equals(cursorAt(range.source$, 4)))
      .toBe(true)
    expect([...iterate(range)]).toEqual([[0, 1], [2, 3]])
  })

  it('materializes dangling fixed-width suffix bytes', () => {
    const range = new FixedValueRange()

    range.pushRange(rangeOf([0, 1, 2]))

    expect([...range.materialize()]).toEqual([0, 1, 2])
  })

  it('lets overrides configure split results after delegating', () => {
    const range = new ConfiguredFixedValueRange()

    range.pushRange(rangeOf([0, 1, 2, 3]))

    const cursor = range.begin()
    cursor.step()

    const committed = range.splitAt(cursor)

    expect(committed).toBeInstanceOf(ConfiguredFixedValueRange)
    expect(committed.configured).toBe(true)
    expect([...iterate(committed)]).toEqual([[0, 1]])
    expect([...iterate(range)]).toEqual([[2, 3]])
  })

  it('rejects split cursors from another virtual', () => {
    const range = new FixedValueRange()
    const other = new FixedValueRange()

    range.pushRange(rangeOf([0, 1]))
    other.pushRange(rangeOf([2, 3]))

    expect(() => range.splitAt(other.begin())).toThrow(
      'Cursor is from another container.')
  })
})

describe('VariableStrideProjectedRangeContainer', () => {
  it('trims incomplete continuation suffixes to token boundaries', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([0, 1]))

    expect(range.end().sourceCursor$.equals(cursorAt(range.source$, 1)))
      .toBe(true)
    expect([...iterate(range)]).toEqual([[0]])
  })

  it('materializes dangling continuation suffix bytes', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([0, 1]))

    expect([...range.materialize()]).toEqual([0, 1])
  })

  it('rejects continuation-only suffixes', () => {
    const range = new VariableValueRange()

    range.pushRange(rangeOf([2]))

    expect(() => range.end()).toThrow('Invalid continuation value.')
  })
})
