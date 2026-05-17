import { describe, it, expect } from 'vitest'
import {
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

const Containers = {
  VectorMap,
  Uint8Vector,
}

const Tests = {
  InsertSelf: {
    targetValues: [1, 4],
    run: target => target.insertRange(target.begin().move(1), target),
    expected: [1, 1, 4, 4],
  },

  AssignSelf: {
    targetValues: [1, 2, 3],
    run: target => target.assignRange(target),
    expected: [1, 2, 3],
  },

  ReplaceSelf: {
    targetValues: [1, 9, 8, 5],
    run: target => target.replaceRange(
      target.begin().move(1),
      target.begin().move(3),
      target,
    ),
    expected: [1, 1, 9, 8, 5, 5],
  },
}

describe.each(Object.entries(Tests))('%s', (_, {
  targetValues,
  run,
  expected,
}) => {
  describe.each(Object.entries(Containers))('%s', (_, Type) => {
    it('should snapshot a self-referencing source range', () => {
      const target = createContainer(Type, targetValues)

      run(target)

      expect([...iterate(target)]).toEqual(expected)
    })
  })
})
