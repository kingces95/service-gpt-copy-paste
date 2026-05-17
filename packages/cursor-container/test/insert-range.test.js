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
  VectorMapAtEnd: {
    type: VectorMap,
    sourceType: VectorMap,
    targetValues: [],
    sourceValues: [1, 2, 3],
    cursor: target => target.end(),
    expected: [1, 2, 3],
  },

  VectorMapInMiddle: {
    type: VectorMap,
    sourceType: VectorMap,
    targetValues: [1, 5],
    sourceValues: [2, 3, 4],
    cursor: target => target.begin().move(1),
    expected: [1, 2, 3, 4, 5],
  },

  Uint8VectorAtEnd: {
    type: Uint8Vector,
    sourceType: Uint8Vector,
    targetValues: [],
    sourceValues: [1, 2, 3],
    cursor: target => target.end(),
    expected: [1, 2, 3],
  },

  Uint8VectorInMiddle: {
    type: Uint8Vector,
    sourceType: Uint8Vector,
    targetValues: [1, 5],
    sourceValues: [2, 3, 4],
    cursor: target => target.begin().move(1),
    expected: [1, 2, 3, 4, 5],
  },

  Uint8VectorFromListAtEnd: {
    type: Uint8Vector,
    sourceType: List,
    targetValues: [],
    sourceValues: [3, 2, 1],
    cursor: target => target.end(),
    expected: [1, 2, 3],
  },

  Uint8VectorFromListInMiddle: {
    type: Uint8Vector,
    sourceType: List,
    targetValues: [1, 5],
    sourceValues: [4, 3, 2],
    cursor: target => target.begin().move(1),
    expected: [1, 2, 3, 4, 5],
  },
}

describe.each(Object.entries(Tests))('%s', (_, {
  type,
  sourceType,
  targetValues,
  sourceValues,
  cursor,
  expected,
}) => {
  it('should insert a range', () => {
    const target = createContainer(type, targetValues)
    const source = createContainer(sourceType, sourceValues)

    target.insertRange(cursor(target), source)

    expect([...iterate(target)]).toEqual(expected)
  })
})
