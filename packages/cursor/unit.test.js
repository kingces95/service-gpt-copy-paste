import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { distance } from '@kingjs/cursor'
import { Queue } from '@kingjs/queue'
import { ByteQueue } from '@kingjs/byte-queue'
// import { CodeUnitQueue } from '@kingjs/code-unit-queue'
// import { CodePointQueue } from '@kingjs/code-point-queue'

const QueueType = {
  Queue,
  ByteQueue,
  // CodeUnitQueue,
  // CodePointQueue
}

describe.each([ 
  ['Queue', { 
    nullPushError: 'Cannot push null to a queue.',
    chunk: 'Item0'
  }],
  ['ByteQueue', { 
    nullPushError: 'Value must be a Buffer.',
    chunk: Buffer.from('$'), 
    value: '$'.charCodeAt(0) 
  }],
  //[CodeUnitQueue, { chunk: Buffer.from('$') }],
  // CodePointQueue 
])('A %s', 
  (name, { nullPushError, chunk, activation = [], value = chunk }) => {
  let queue
  beforeEach(() => {
    queue = new QueueType[name](...activation)
  })
  it('should be empty.', () => {
    expect(queue.isEmpty).toBe(true)
  })
  it('should pop an empty array.', () => {
    expect(queue.pop()).toEqual([])
  })
  it('should throw if pushing null attempted.', () => {
    expect(() => queue.push(null)).toThrow(nullPushError)
  })
  it('should throw if pushing undefined attempted.', () => {
    const undefinedPushError = nullPushError.replace('null', 'undefined')
    expect(() => queue.push(undefined)).toThrow(undefinedPushError)
  })
  describe('begin cursor', () => {
    let begin
    beforeEach(() => {
      begin = queue.begin()
    })
    it('should be at the beginning.', () => {
      expect(begin.isBegin).toBe(true)
    })
    it('should be at the end.', () => {
      expect(begin.isEnd).toBe(true)
    })
    it('should return a null value.', () => {
      expect(begin.value).toBe(null)
    })
    it('should not step.', () => {
      expect(begin.step()).toBe(false)
    })
    it('should not step back.', () => {
      expect(begin.stepBack()).toBe(false)
    })
    describe('and end cursor', () => {
      let end
      beforeEach(() => {
        end = queue.end()
      })
      it('should be equal to the begin cursor.', () => {
        expect(end.equals(begin)).toBe(true)
      })
      it('should not be the begin cursor.', () => {
        expect(end).not.toBe(begin)
      })
      it('should be at the beginning.', () => {
        expect(end.isBegin).toBe(true)
      })
      it('should be at the end.', () => {
        expect(end.isEnd).toBe(true)
      })
      it('should return a null value.', () => {
        expect(end.value).toBe(null)
      })
      it('should not step.', () => {
        expect(end.step()).toBe(false)
      })
      it('should not step back.', () => {
        expect(end.stepBack()).toBe(false)
      })
      describe('after pushing a chunk with one item', () => {
        beforeEach(() => {
          queue.push(chunk)
        })
        it('should not be at the end.', () => {
          expect(end.isEnd).toBe(false)
        })
        it('should return the value.', () => {
          // end cursor is not invalidated by pushing but rather will now
          // return the value of the first item of the chunk pushed.
          expect(end.value).toBe(value)
        })
      })
    })
    describe('after cloning', () => {
      let clone
      beforeEach(() => {
        clone = begin.clone()
      })
      it('should be equal to the original.', () => {
        expect(clone.isBegin).toBe(true)
      })
      it('should not be the original.', () => {
        expect(clone).not.toBe(begin)
      })
      it('should be at the beginning.', () => {
        expect(clone.isBegin).toBe(true)
      })
      it('should be at the end.', () => {
        expect(clone.isEnd).toBe(true)
      })
      it('should return a null value.', () => {
        expect(clone.value).toBe(null)
      })
      it('should not step.', () => {
        expect(clone.step()).toBe(false)
      })
      it('should not step back.', () => {
        expect(clone.stepBack()).toBe(false)
      })
    })
  })
  describe('after pushing a chunk with one item', () => {
    beforeEach(() => {
      queue.push(chunk)
    })
    it('should have not be empty.', () => {
      expect(queue.isEmpty).toBe(false)
    })
    describe('then popping', () => {
      beforeEach(() => {
        queue.pop()
      })
      it('should be empty.', () => {
        expect(queue.isEmpty).toBe(true)
      })
    })
    describe('begin cursor', () => {
      let begin
      beforeEach(() => {
        begin = queue.begin()
      })
      it('should be at the beginning.', () => {
        expect(begin.isBegin).toBe(true)
      })
      it('should not be at the end.', () => {
        expect(begin.isEnd).toBe(false)
      })
      it('should return the value.', () => {
        expect(begin.value).toBe(value)
      })
      it('should step.', () => {
        expect(begin.step()).toBe(true)
      })
      it('should not step back.', () => {
        expect(begin.stepBack()).toBe(false)
      })
      describe('and end cursor', () => {
        let end
        beforeEach(() => {
          end = queue.end()
        })
        it('should be be separated by a distance of 1.', () => {
          expect(distance(begin, end)).toBe(1)
        })
      })
      describe('cloned', () => {
        let clone
        beforeEach(() => {
          clone = begin.clone()
        })
        it('should be equal to the original.', () => {
          expect(clone.equals(begin)).toBe(true)
        })
        it('should not be the original.', () => {
          expect(clone).not.toBe(begin)
        })
        it('should be at the beginning.', () => {
          expect(clone.isBegin).toBe(true)
        })
        it('should not be at the end.', () => {
          expect(clone.isEnd).toBe(false)
        })
        it('should return the value.', () => {
          expect(clone.value).toBe(value)
        })
        it('should step.', () => {
          expect(clone.step()).toBe(true)
        })
        it('should not step back.', () => {
          expect(clone.stepBack()).toBe(false)
        })
      })
      describe('stepped forward', () => {
        beforeEach(() => {
          begin.step()
        })
        it('should be at the end.', () => {
          expect(begin.isEnd).toBe(true)
        })
        it('should not be at the beginning.', () => {
          expect(begin.isBegin).toBe(false)
        })
        it('return a null value.', () => {
          expect(begin.value).toBe(null)
        })
        it('should not step.', () => {
          expect(begin.step()).toBe(false)
        })
        it('should step back.', () => {
          expect(begin.stepBack()).toBe(true)
        })
        it('should be equal to the end cursor.', () => {
          expect(begin.equals(queue.end())).toBe(true)
        })
        describe('after stepping back', () => {
          beforeEach(() => {
            begin.stepBack()
          })
          it('should be at the beginning.', () => {
            expect(begin.isBegin).toBe(true)
          })
          it('should not be at the end.', () => {
            expect(begin.isEnd).toBe(false)
          })
          it('should return the value.', () => {
            expect(begin.value).toBe(value)
          })
        })
      })
      describe('after popping', () => {
        let result
        beforeEach(() => {
          result = queue.pop()
        })
        it('should return an array with the chunk.', () => {
          expect(result).toEqual([chunk])
        })
        it('should not be active.', () => {
          expect(begin.isActive).toBe(false)
        })
        it('should throw when asked for a value.', () => {
          expect(() => begin.value).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when trying to step.', () => {
          expect(() => begin.step()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when trying to step back.', () => {
          expect(() => begin.stepBack()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw testing equality.', () => {
          expect(() => begin.equals(begin)).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when cloning.', () => {
          expect(() => begin.clone()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw testing isBegin.', () => {
          expect(() => begin.isBegin).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw testing isEnd.', () => {
          expect(() => begin.isEnd).toThrow(
            'Container has been popped since cursor was created.')
        })
        describe('recycled begin cursor', () => {
          beforeEach(() => {
            begin = queue.begin(begin)
          })
          it('should be the original.', () => {
            expect(begin).toBe(begin)
          })
          it('should be active.', () => {
            expect(begin.isActive).toBe(true)
          })
          it('should be at the beginning.', () => {
            expect(begin.isBegin).toBe(true)
          })
          it('should return a null value.', () => {
            expect(begin.value).toBe(null)
          })
        })
        describe('new begin cursor', () => {
          let begin2
          beforeEach(() => {
            begin2 = queue.begin()
          })
          it('should be different from the original.', () => {
            expect(begin2).not.toBe(begin)
          })
          it('should be at the beginning.', () => {
            expect(begin2.isBegin).toBe(true)
          })
          it('should be at the end.', () => {
            expect(begin2.isEnd).toBe(true)
          })
          it('should return a null value.', () => {
            expect(begin2.value).toBe(null)
          })
          it('should not step.', () => {
            expect(begin2.step()).toBe(false)
          })
          it('should not step back.', () => {
            expect(begin2.stepBack()).toBe(false)
          })
        })
      })
    })
  })
})