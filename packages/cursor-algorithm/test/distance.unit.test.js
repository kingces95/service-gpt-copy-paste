import { describe, it, expect } from 'vitest'
import {
  ReadableRangeProbe,
  RandomAccessRangeProbe,
} from '@kingjs/cursor-shape'
import {
  ForwardList,
  Deque,
  List,
  ArrayMap,
  Uint8Vector,
  Uint16Vector,
  Uint32Vector,
  Float64Vector,
} from '@kingjs/cursor-container'
import { subrange } from '@kingjs/cursor-view'
import { distance } from '@kingjs/cursor-algorithm'
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

const Tests = {
  Empty: {
    values: [],
    createRange: source => source,
    expected: 0,
  },

  Range: {
    values: [1, 2, 3],
    createRange: source => source,
    expected: 3,
  },

  Subrange: {
    values: [1, 2, 3],
    createRange(source) {
      const first = source.begin()
      first.step()
      return subrange(first, source.end())
    },
    expected: 2,
  },

  ReversedSubrange: {
    values: [1, 2, 3],
    createRange(source) {
      return subrange(source.end(), source.begin())
    },
    expected: -3,
    requires: RandomAccessRangeProbe,
  },
}

describe.each(Object.entries(Tests))('%s', (_, {
  values,
  createRange,
  expected,
  requires = ReadableRangeProbe,
}) => {
  const containers = Object.entries(Containers).flatMap(([name, Type]) => {
    const source = createContainer(Type, values)
    const range = createRange(source)

    if (!(range instanceof requires))
      return []

    return [[name, range]]
  })

  describe.each(containers)('%s', (_, range) => {
    it('should measure distance', () => {
      expect(distance(range)).toBe(expected)
    })
  })
})

describe('distance', () => {
  it('should not mutate the begin cursor of a subrange', () => {
    const source = createContainer(ArrayMap, Values)
    const first = source.begin()
    first.step()

    expect(distance(subrange(first, source.end()))).toBe(2)
    expect(first.value).toBe(2)
  })

  it('should use random access distance when available', () => {
    const source = createContainer(ArrayMap, Values)
    const begin = source.begin()
    const end = source.end()
    let wasMeasured = false

    source.begin = function() {
      begin.distanceTo = function(other) {
        wasMeasured = true
        return 3
      }

      return begin
    }

    source.end = function() {
      return end
    }

    expect(distance(source)).toBe(3)
    expect(wasMeasured).toBe(true)
  })
})
