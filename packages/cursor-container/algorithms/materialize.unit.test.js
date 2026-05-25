import { describe, it, expect } from 'vitest'
import { materialize, ArrayMap } from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'

function createArrayMap(...values) {
  const result = new ArrayMap()

  for (const value of values)
    result.pushBack(value)

  return result
}

const Tests = {
  Range: {
    values: [1, 2, 3],
    range: source => source,
    expected: [1, 2, 3],
  },

  Subrange: {
    values: [1, 2, 3],
    range(source) {
      const first = source.begin()
      first.step()
      return subrange(first, source.end())
    },
    expected: [2, 3],
  },
}

describe.each(Object.entries(Tests))('%s', (_, test) => {
  it('should materialize', () => {
    const source = createArrayMap(...test.values)
    const range = test.range(source)
    const result = materialize(range)

    expect(result).toBeInstanceOf(ArrayMap)
    expect(result.size).toBe(test.expected.length)
    for (let i = 0; i < test.expected.length; i++)
      expect(result.at(i)).toBe(test.expected[i])
  })
})

describe('materialize', () => {
  it('should not mutate the original begin cursor', () => {
    const source = createArrayMap(1, 2, 3)
    const first = source.begin()
    first.step()

    materialize(subrange(first, source.end()))

    expect(first.value).toBe(2)
  })
})
