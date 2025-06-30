import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { Vector } from '@kingjs/cursor'
import { distance, advance } from '@kingjs/cursor'

describe.each([
  Vector
])('Given a sequence container with n items', (Container) => {
  let container
  let itemCount = 10
  beforeEach(() => {
    container = new Container([...Array(itemCount).keys()])
  })
  describe('distance', () => {
    it('should return zero when the cursors are the same', () => {
      const begin = container.begin()
      const end = container.begin()
      expect(distance(begin, end)).toBe(0)
    })
    it('should return the distance between two cursors', () => {
      const begin = container.begin()
      const end = container.end()
      expect(distance(begin, end)).toBe(itemCount)
    })
    it('should advance the begin cursor to the end cursor', () => {
      const begin = container.begin()
      const end = container.end()
      distance(begin, end)
      expect(begin.equals(end)).toBe(true)
    })
    it('should throw an error if the end cursor is not reachable', () => {
      const begin = container.begin()
      const end = container.end()
      expect(() => distance(end, begin)).toThrow(
        "Cannot calculate distance: failed to find end."
      )
    })
  })
  describe('advance', () => {
    it('should advance the cursor by the specified count', () => {
      const begin = container.begin()
      advance(begin, 5)
      expect(begin.value).toBe(5)
    })
    it('should throw an error if the count is negative', () => {
      const begin = container.begin()
      expect(() => advance(begin, -1)).toThrow(
        "Cannot advance: count must be non-negative."
      )
    })
    it('should throw an error if the count exceeds the container size', () => {
      const end = container.end()
      expect(() => advance(end, 1)).toThrow(
        "Cannot step: cursor is at the end."
      )
    })
  })
})