import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { ObjectSlidingWindow } from './index.js'

describe('An ObjectSlidingWindow', () => {
  let window
  beforeEach(() => {
    window = new ObjectSlidingWindow()
  })
  it('should have count 0.', () => {
    expect(window.count).toBe(0)
  })
  it('should throw if a pushing null attempted.', () => {
    expect(() => window.push(null)).toThrow(
      'Cannot push null to a SlidingWindow.')
  })
  it('should throw if a pushing undefined attempted.', () => {
    expect(() => window.push(undefined)).toThrow(
      'Cannot push undefined to a SlidingWindow.')
  })
  it('should throw if pushing a chunk with null element.', () => {
    expect(() => window.push([null])).toThrow(
      'Chunk elements cannot be null or undefined.')
  })
  describe.each([
    ['an object', { id: 42 }],
    ['an array', [{ id: 42 }]],
  ])('after pushing %s', (_, item) => {
    beforeEach(() => {
      window.push(item)
    })
    it('should have count 1.', () => {
      expect(window.count).toBe(1)
    })
    describe('then popping', () => {
      let shifted
      beforeEach(() => {
        shifted = window.shift()
      })
      it('should have count 0.', () => {
        expect(window.count).toBe(0)
      })
    })
  })
})