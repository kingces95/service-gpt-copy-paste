import { describe, it, expect } from 'vitest'
import {
  List,
  Uint8Vector,
  VectorMap,
} from '@kingjs/cursor-container'
import { iterate } from '@kingjs/cursor-algorithm'

function createContainer(Type, values = []) {
  const result = new Type()

  for (const value of values)
    result.insert(value, { })

  return result
}

const Tests = {
  VectorMap: {
    type: VectorMap,
    sourceType: VectorMap,
    targetValues: [1, 9, 8, 5],
    sourceValues: [2, 3, 4],
    first: target => target.begin().move(1),
    last: target => target.begin().move(3),
    expected: [1, 2, 3, 4, 5],
  },

  Uint8Vector: {
    type: Uint8Vector,
    sourceType: Uint8Vector,
    targetValues: [1, 9, 8, 5],
    sourceValues: [2, 3, 4],
    first: target => target.begin().move(1),
    last: target => target.begin().move(3),
    expected: [1, 2, 3, 4, 5],
  },

  Uint8VectorFromList: {
    type: Uint8Vector,
    sourceType: List,
    targetValues: [1, 9, 8, 5],
    sourceValues: [4, 3, 2],
    first: target => target.begin().move(1),
    last: target => target.begin().move(3),
    expected: [1, 2, 3, 4, 5],
  },
}

describe.each(Object.entries(Tests))('%s', (_, {
  type,
  sourceType,
  targetValues,
  sourceValues,
  first,
  last,
  expected,
}) => {
  it('should replace a cursor range with a range', () => {
    const target = createContainer(type, targetValues)
    const source = createContainer(sourceType, sourceValues)

    target.replaceRange(first(target), last(target), source)

    expect([...iterate(target)]).toEqual(expected)
  })
})
