import { describe, it, expect } from 'vitest'
import { ArrayMap } from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { iterate } from '@kingjs/cursor-algorithm'

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
  it('should iterate', () => {
    const source = createArrayMap(...test.values)
    const range = test.range(source)

    expect([...iterate(range)]).toEqual(test.expected)
  })
})
