import { describe, expect, it } from 'vitest'
import {
  advance,
  iterate,
  previous,
  retreat,
} from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { define } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import {
  ProjectedRangePart,
  ProjectedRangeContainer,
  trimContinuationSuffix,
  VirtualContainer,
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

class FixedValueRange extends ProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer())
  }

  static {
    compose(this, ProjectedRangePart, {
      trimEnd$(sourceCursor) {
        return previous(sourceCursor, this.bytesPushed % 2)
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, 2)
      },

      stepBackValue$(sourceCursor) {
        retreat(sourceCursor, 2)
      },

      decodeValue$(sourceCursor) {
        const first = sourceCursor.value
        sourceCursor.step()
        return [first, sourceCursor.value]
      },
    })
  }
}

class VariableValueRange extends ProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer())
  }

  static {
    compose(this, ProjectedRangePart, {
      trimEnd$(sourceCursor) {
        return trimContinuationSuffix(
          this.source$,
          sourceCursor,
          {
            isContinuation: isContinuation,
            lengthOf: codePointLengthOf,
          }
        )
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, codePointLengthOf(sourceCursor.value))
      },

      stepBackValue$(sourceCursor) {
        sourceCursor.stepBack()

        while (isContinuation(sourceCursor.value))
          sourceCursor.stepBack()
      },

      decodeValue$(sourceCursor) {
        const values = []
        const stride = codePointLengthOf(sourceCursor.value)

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

function isContinuation(value) {
  return value == 2
}

function codePointLengthOf(value) {
  return value == 1 ? 2 : 1
}

describe('fixed stride projected range policy', () => {
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

  it('keeps fixed-width trim aligned to bytes pushed', () => {
    const range = new FixedValueRange()

    range.pushRange(rangeOf([0, 1]))

    const commit = range.begin()
    commit.step()

    range.popRangeAt(commit)
    range.pushRange(rangeOf([2]))

    expect(range.end().sourceCursor$.equals(range.source$.begin()))
      .toBe(true)
    expect([...iterate(range)]).toEqual([])
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

describe('variable stride projected range policy', () => {
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
