import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Queue } from './index.js'

describe('A queue', () => {
  let queue
  beforeEach(() => {
    queue = new Queue()
  })
  it('should have count 0.', () => {
    expect(queue.count).toBe(0)
  })
  it('should throw if a pushing null attempted.', () => {
    expect(() => queue.push(null)).toThrow('Cannot push null to a queue.')
  })
  it('should throw if a pushing undefined attempted.', () => {
    expect(() => queue.push(undefined)).toThrow('Cannot push undefined to a queue.')
  })
  describe('after pushing an item', () => {
    beforeEach(() => {
      queue.push('Item0')
    })
    it('should have count 1.', () => {
      expect(queue.count).toBe(1)
    })
    describe('then popping', () => {
      let popped
      beforeEach(() => {
        popped = queue.pop()
      })
      it('should have count 0.', () => {
        expect(queue.count).toBe(0)
      })
    })
  })
})