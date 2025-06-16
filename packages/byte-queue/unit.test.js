import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { ByteQueue } from './index.js'

describe('A byte queue', () => {
  let queue
  beforeEach(() => {
    queue = new ByteQueue()
  })
  it('should have count 0.', () => {
    expect(queue.count).toBe(0)
  })
  describe('after pushing an buffer', () => {
    beforeEach(() => {
      queue.push(Buffer.from('Item0'))
    })
    it('should have count 5.', () => {
      expect(queue.count).toBe(5)
    })
    describe('then popping the end cursor', () => {
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