import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { ArrayMap } from '@kingjs/cursor-container'
import { distance } from './distance.js'
import { advance } from './advance.js'

describe.each([
  ArrayMap
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
    it('should not advance a random access begin cursor', () => {
      const begin = container.begin()
      const end = container.end()
      distance(begin, end)
      expect(begin.equals(container.begin())).toBe(true)
    })
    it('should return negative distance between reversed random access cursors', () => {
      const begin = container.begin()
      const end = container.end()
      expect(distance(end, begin)).toBe(-itemCount)
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
        "Cannot move cursor out of bounds."
      )
    })
  })
})
