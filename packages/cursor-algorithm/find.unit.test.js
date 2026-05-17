import { describe, it, expect } from 'vitest'
import { VectorMap } from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { find } from '@kingjs/cursor-algorithm'

function createVectorMap(...values) {
  const result = new VectorMap()

  for (const value of values)
    result.push(value)

  return result
}

const Tests = {
  Empty: {
    values: [],
    range: source => source,
    predicate: cursor => cursor.value == 2,
    expected: false,
  },

  Found: {
    values: [1, 2, 3],
    range: source => source,
    predicate: cursor => cursor.value == 2,
    expected: true,
  },

  NotFound: {
    values: [1, 2, 3],
    range: source => source,
    predicate: cursor => cursor.value == 4,
    expected: false,
  },

  Subrange: {
    values: [1, 2, 3],
    range(source) {
      const first = source.begin()
      first.step()
      return subrange(first, source.end())
    },
    predicate: cursor => cursor.value == 1,
    expected: false,
  },
}

describe.each(Object.entries(Tests))('%s', (_, test) => {
  it('should find a matching cursor', () => {
    const source = createVectorMap(...test.values)
    const range = test.range(source)

    expect(find(range, test.predicate)).toBe(test.expected)
  })
})

describe('find', () => {
  it('should not mutate the begin cursor of a subrange', () => {
    const source = createVectorMap(1, 2, 3)
    const first = source.begin()
    first.step()

    expect(find(subrange(first, source.end()), cursor => cursor.value == 3))
      .toBe(true)
    expect(first.value).toBe(2)
  })
})
