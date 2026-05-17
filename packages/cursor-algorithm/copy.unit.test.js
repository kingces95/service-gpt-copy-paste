import { describe, it, expect } from 'vitest'
import {
  Chain,
  Deque,
  Float64Vector,
  List,
  Uint8Vector,
  Uint16Vector,
  Uint32Vector,
  VectorMap,
} from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { copy, iterate } from '@kingjs/cursor-algorithm'

const Values = [1, 2, 3]

const Containers = {
  List,
  Chain,
  Deque,
  VectorMap,
  Uint8Vector,
  Uint16Vector,
  Uint32Vector,
  Float64Vector,
}

function createContainer(Type, values = Values) {
  const result = new Type()

  for (const value of values)
    result.insert(value, { })

  return result
}

function createTarget(size) {
  const result = new VectorMap()

  for (let i = 0; i < size; i++)
    result.insert(0, { })

  return result
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
  it('should copy between cursors with matching span types', () => {
    const source = createContainer(Uint8Vector, Values)
    const target = createContainer(Uint8Vector, [0, 0, 0])

    expect(copy(target.begin(), source)).toBe(Values.length)
    expect([...iterate(target)]).toEqual([...iterate(source)])
  })
})
