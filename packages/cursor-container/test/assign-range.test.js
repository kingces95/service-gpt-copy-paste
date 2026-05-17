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
    targetValues: [9, 8],
    sourceValues: [1, 2, 3],
    expected: [1, 2, 3],
  },

  Uint8Vector: {
    type: Uint8Vector,
    sourceType: Uint8Vector,
    targetValues: [9, 8],
    sourceValues: [1, 2, 3],
    expected: [1, 2, 3],
  },

  Uint8VectorFromList: {
    type: Uint8Vector,
    sourceType: List,
    targetValues: [9, 8],
    sourceValues: [3, 2, 1],
    expected: [1, 2, 3],
  },
}

describe.each(Object.entries(Tests))('%s', (_, {
  type,
  sourceType,
  targetValues,
  sourceValues,
  expected,
}) => {
  it('should assign a range', () => {
    const target = createContainer(type, targetValues)
    const source = createContainer(sourceType, sourceValues)

    target.assignRange(source)

    expect([...iterate(target)]).toEqual(expected)
  })
})
