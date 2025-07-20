import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Cursor } from './cursor.js'
import { 
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from './cursor-concepts.js'

import { List } from '../container/sequence/list.js'
import { Chain } from '../container/sequence/rewind/chain.js'
import { Vector } from '../container/sequence/rewind/indexable/vector.js'
import { Deque } from '../container/sequence/rewind/indexable/deque.js'
import { NodeBuffer } from '../container/sequence/rewind/indexable/contiguous/node-buffer.js'
import { EcmaBuffer } from '../container/sequence/rewind/indexable/contiguous/ecma-buffer.js' 

const value0 = 0
const value1 = 1

const cases = [
  ['List', List, List.cursorType.prototype,
    [InputCursorConcept, OutputCursorConcept, ForwardCursorConcept]],
  ['Chain', Chain, Chain.cursorType.prototype,
    [InputCursorConcept, OutputCursorConcept, BidirectionalCursorConcept]],
  ['Vector', Vector, Vector.cursorType.prototype, 
    [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept]],
  ['Deque', Deque, Deque.cursorType.prototype, 
    [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept]],
  ['NodeBuffer', NodeBuffer, NodeBuffer.cursorType.prototype,
    [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept]],
  ['EcmaBuffer', EcmaBuffer, EcmaBuffer.cursorType.prototype,
    [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept]],
]

// test the functionality of the cursor container
describe.each(cases)('A %s', (name, type, cursorPrototype, concepts) => {
  let f0
  let begin
  beforeEach(() => {
    f0 = new type()
    begin = f0.begin()
  })
  it('should satisfy the concepts', () => {
    for (const concept of concepts) {
      expect(cursorPrototype).toBeInstanceOf(concept)
    }
  })
  it('has a cursor type whose prototype extends Cursor', () => {
    expect(f0.constructor.cursorType.prototype).toBeInstanceOf(Cursor)
  })
  it('should be empty', () => {
    expect(f0.isEmpty).toBe(true)
  })
  describe('unshift a value', () => {
    beforeEach(() => {
      f0.unshift(value0)
    })
    it('should throw when accessed stale cursors', () => {
      if (f0 instanceof RandomAccessCursorConcept)
        expect(() => { begin.step() }).toThrow(
          'Cursor is stale and cannot be used.')
    })
    it('should have a front value', () => {
      expect(f0.front).toBe(value0)
    })
    it('should not be empty', () => {
      expect(f0.isEmpty).toBe(false)
    })
    describe('end', () => {
      let cursor
      beforeEach(() => {
        cursor = f0.end()
      })
      it('should be at the end', () => {
        expect(cursor.equals(f0.end())).toBe(true)
      })
      it('should not be at the beginning', () => {
        expect(cursor.equals(f0.begin())).toBe(false)
      })
    })
    describe('begin', () => {
      let cursor
      beforeEach(() => {
        cursor = f0.begin()
      })
      it('should be at the beginning', () => {
        expect(cursor.equals(f0.begin())).toBe(true)
      })
      it('should not be at the end', () => {
        expect(cursor.equals(f0.end())).toBe(false)
      })
      it('should not be read-only', () => {
        expect(cursor.isReadOnly).toBe(false)
      })
      describe.each([ 
        // Node Deque do not support random access writes
        type != Deque
      ].filter(Boolean))('then set a value', () => {
        beforeEach(() => {
          cursor.value = value1
        })
        it('should have the new value', () => {
          expect(cursor.value).toBe(value1)
        })
        it('should have the new front value', () => {
          expect(f0.front).toBe(value1)
        })
      })
      describe('then step', () => {
        let didStep
        beforeEach(() => {
          didStep = cursor.step()
        })
        it('should have stepped', () => {
          expect(didStep).toBe(cursor)
        })
        it('should be at the end', () => {
          expect(cursor.equals(f0.end())).toBe(true)
        })
      })
      describe('made read-only', () => {
        beforeEach(() => {
          cursor.isReadOnly = true
        })
        it('should be read-only', () => {
          expect(cursor.isReadOnly).toBe(true)
        })
      })
    })
    describe('cbegin', () => {
      let cursor
      beforeEach(() => {
        cursor = f0.cbegin()
      })
      it('should be read-only', () => {
        expect(cursor.isReadOnly).toBe(true)
      })
      it('should not be writable', () => {
        expect(() => { cursor.value = 1 }).toThrow(
          'Cursor is read-only.')
      })
      it('cannot be made writable', () => {
        expect(() => { cursor.isReadOnly = false }).toThrow(
          'Cannot make read-only cursor writable.')
      })
    })
    describe('toRange', () => {
      let range
      beforeEach(() => {
        range = f0.toRange()
      })
      it('begin is equal to the factory begin', () => {
        expect(range.end.equals(f0.end())).toBe(true)
      })
      it('end is equal to the factory end', () => {
        expect(range.begin.equals(f0.begin())).toBe(true)
      })
    })
    describe('toCRange', () => {
      let range
      beforeEach(() => {
        range = f0.toCRange()
      })
      it('begin is equal to the factory cbegin', () => {
        expect(range.end.equals(f0.cend())).toBe(true)
      })
      it('end is equal to the factory cend', () => {
        expect(range.begin.equals(f0.cbegin())).toBe(true)
      })
    })
    describe.each([ 
      cursorPrototype instanceof BidirectionalCursorConcept 
    ].filter(Boolean))
    ('bidirectional container', (isBidirectional) => {
      it('should have a back value', () => {
        expect(f0.back).toBe(value0)
      })
      describe('then pop', () => {
        let popped
        beforeEach(() => {
          popped = f0.pop()
        })
        it('should be empty', () => {
          expect(f0.isEmpty).toBe(true)
        })
        it('should have popped the value', () => {
          expect(popped).toBe(value0)
        })
      })
    })
    describe.each([
      ['readable', 'begin', 'end'],
      ['writable', 'cbegin', 'cend'],
    ])('%s cursor', (name, beginFn, endFn) => {
      let cursor
      beforeEach(() => {
        cursor = f0[beginFn]()
      })
      describe('then shift', () => {
        let shifted
        beforeEach(() => {
          shifted = f0.shift()
        })
        it('should be empty', () => {
          expect(f0.isEmpty).toBe(true)
        })
        it('should have shifted', () => {
          expect(shifted).toBe(value0)
        })
        it('should throw when accessed', () => {
          expect(() => { cursor.step() }).toThrow(
            'Cursor is stale and cannot be used.')
        })
      })
      describe('next', () => {
        let next
        beforeEach(() => {
          next = cursor.next()
        })
        it('should be the value', () => {
          expect(next).toBe(value0)
        })
        it('should advanced the cursor to the end', () => {
          expect(cursor.equals(f0[endFn]())).toBe(true)
        })
      })
      describe('and end', () => {
        let end
        beforeEach(() => {
          end = f0[endFn]()
        })
        it('should be equatable', () => {
          expect(cursor.equatableTo(end)).toBe(true)
        })
        it('should not be equal', () => {
          expect(cursor.equals(end)).toBe(false)
        })
      })
      describe('step', () => {
        let didStep
        beforeEach(() => {
          didStep = cursor.step()
        })
        it('should have stepped', () => {
          expect(didStep).toBe(cursor)
        })
        it('should be at the end', () => {
          expect(cursor.equals(f0[endFn]())).toBe(true)
        })
        describe.each([ 
          cursorPrototype instanceof RandomAccessCursorConcept
        ].filter(Boolean))
          ('random access cursor', (isRandomAccess) => {
          
          describe('moved nowhere', () => {
            let moved
            beforeEach(() => {
              moved = cursor.move(0)
            })
            it('should have "moved"', () => {
              expect(moved).toBe(cursor)
            })
            it('should still be at the end', () => {
              expect(cursor.equals(f0[endFn]())).toBe(true)
            })
          })
          describe('moved back', () => {
            let movedBack
            beforeEach(() => {
              movedBack = cursor.move(-1)
            })
            it('should have moved', () => {
              expect(movedBack).toBe(cursor)
            })
            it('should be at the beginning', () => {
              expect(cursor.equals(f0[beginFn]())).toBe(true)
            })
            describe('then moved forward', () => {
              let movedForward
              beforeEach(() => {
                movedForward = cursor.move(1)
              })
              it('should have moved forward', () => {
                expect(movedForward).toBe(cursor)
              })
              it('should be at the end', () => {
                expect(cursor.equals(f0[endFn]())).toBe(true)
              })
            })
          })
        })
        describe.each([ 
          cursorPrototype instanceof BidirectionalCursorConcept
        ].filter(Boolean))
          ('bidirectional cursor', (isBidirectional) => {

          it('should be able to step back', () => {
            const didStepBack = cursor.stepBack()
            expect(didStepBack).toBe(cursor)
            expect(cursor.equals(f0[beginFn]())).toBe(true)
          })
        })
      })
    })
  })
})
