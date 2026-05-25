import { describe, it, expect } from 'vitest'
import {
  ForwardList,
  Deque,
  Float64Vector,
  List,
  Uint8Vector,
  Uint16Vector,
  Uint32Vector,
  ArrayMap,
} from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { copy, iterate } from '@kingjs/cursor-algorithm'
import { createContainer } from '../../cursor-container/test/create-container.js'

const Values = [1, 2, 3]

const Containers = {
  ForwardList,
  List,
  Deque,
  ArrayMap,
  Uint8Vector,
  Uint16Vector,
  Uint32Vector,
  Float64Vector,
}

function createTarget(size) {
  return createContainer(ArrayMap, Array(size).fill(0))
}

const Tests = {
  Range: {
    values: Values,
    createRange: source => source,
  },

  Subrange: {
    values: Values,
    createRange(source) {
      const first = source.begin()
      first.step()
      return subrange(first, source.end())
    },
  },
}

describe.each(Object.entries(Tests))('%s', (_, {
  values,
  createRange,
}) => {
  describe.each(Object.entries(Containers))('%s', (_, Type) => {
    it('should copy range values', () => {
      const source = createContainer(Type, values)
      const range = createRange(source)
      const expected = [...iterate(range)]
      const target = createTarget(expected.length)

      expect(copy(target.begin(), range)).toBe(expected.length)
      expect([...iterate(target)]).toEqual(expected)
    })
  })
})

describe('contiguous copy', () => {
  it('should use span copy when span types match', () => {
    const source = createContainer(Uint8Vector, Values)
    const target = createContainer(Uint8Vector, [0, 0, 0])
    const cursor = target.begin()
    const span = cursor.span
    let usedSpan = false

    cursor.span = function(...args) {
      usedSpan = true
      return span.apply(this, args)
    }

    expect(copy(cursor, source)).toBe(Values.length)
    expect(usedSpan).toBe(true)
    expect([...iterate(target)]).toEqual([...iterate(source)])
  })

  it('should fall back when span types do not match', () => {
    const source = createContainer(Uint8Vector, Values)
    const target = createContainer(Uint16Vector, [0, 0, 0])
    const cursor = target.begin()

    cursor.span = function() {
      throw new Error('span should not be called.')
    }

    expect(copy(cursor, source)).toBe(Values.length)
    expect([...iterate(target)]).toEqual([...iterate(source)])
  })
})
