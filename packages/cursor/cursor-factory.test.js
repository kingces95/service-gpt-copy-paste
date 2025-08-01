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

import { 
  List,
  Chain,
  Vector,
  Deque,
  NodeBuffer,
  EcmaBuffer 
} from '@kingjs/cursor-container'

const value0 = 0
const value1 = 1

const cases = [
  ['List', List, List.cursorType,
    [InputCursorConcept, OutputCursorConcept, ForwardCursorConcept]],
  ['Chain', Chain, Chain.cursorType,
    [InputCursorConcept, OutputCursorConcept, BidirectionalCursorConcept]],
  ['Vector', Vector, Vector.cursorType, 
    [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept]],
  ['Deque', Deque, Deque.cursorType, 
    [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept]],
  ['NodeBuffer', NodeBuffer, NodeBuffer.cursorType,
    [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept]],
  ['EcmaBuffer', EcmaBuffer, EcmaBuffer.cursorType,
    [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept]],
]

// test the functionality of the cursor container
describe.each(cases)('A %s', (name, type, cursorType, concepts) => {
  let f0
  let begin
  beforeEach(() => {
    f0 = new type()
    begin = f0.begin()
  })
  it('should satisfy the concepts', () => {
    for (const concept of concepts) {
      expect(cursorType.prototype).toBeInstanceOf(concept)
    }
  })
  it('has a cursor type whose prototype extends Cursor', () => {
    expect(f0.constructor.cursorType.prototype).toBeInstanceOf(Cursor)
  })
  it('should be empty', () => {
    expect(f0.isEmpty).toBe(true)
  })
  it('should throw if shifted', () => {
    expect(() => { f0.shift() }).toThrow(
      'Container is empty.')
  })
  it('should not have a front value', () => {
    expect(() => { f0.front }).toThrow(
      'Container is empty.')
  })
  describe.each([ 
    cursorType.prototype instanceof BidirectionalCursorConcept 
  ].filter(Boolean))
  ('bidirectional container', (isBidirectional) => {
    it('should throw if popped', () => {
      expect(() => { f0.pop() }).toThrow(
        'Container is empty.')
    })
    it('should not have a back value', () => {
      expect(() => { f0.back }).toThrow(
        'Container is empty.')
    })
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
      cursorType.prototype instanceof BidirectionalCursorConcept 
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
          cursorType.prototype instanceof RandomAccessCursorConcept
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
          cursorType.prototype instanceof BidirectionalCursorConcept
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
  describe('disposed', () => {
    beforeEach(() => {
      f0.dispose()
    })

    it('should throw if disposed again', () => {
      expect(() => { f0.dispose() }).toThrow(
        'Container is disposed and cannot be used.')
    })

    describe('accessing cursor factory', () => {
      it('should throw testing if empty', () => {
        expect(() => { f0.isEmpty }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw if data is accessed', () => {
        expect(() => { f0.data }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a begin cursor', () => {
        expect(() => { f0.begin() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have an end cursor', () => {
        expect(() => { f0.end() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a cbegin cursor', () => {
        expect(() => { f0.cbegin() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a cend cursor', () => {
        expect(() => { f0.cend() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a beforeBegin cursor', () => {
        expect(() => { f0.beforeBegin() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a afterEnd cursor', () => {
        expect(() => { f0.afterEnd() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a range', () => {
        expect(() => { f0.toRange() }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a cRange', () => {
        expect(() => { f0.toCRange() }).toThrow(
          'Container is disposed and cannot be used.')
      })
    })

    describe('accessing a sequence container', () => {
      it('should not have a front value', () => {
        expect(() => { f0.front }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw when unshifted', () => {
        expect(() => { f0.unshift(value0) }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw when shifted', () => {
        expect(() => { f0.shift() }).toThrow(
          'Container is disposed and cannot be used.')
      })  
    })

    describe('accessing a rewind container', () => {
      it('should throw on count', () => {
        expect(() => { f0.count }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should not have a back value', () => {
        expect(() => { f0.back }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw when pushed', () => {
        expect(() => { f0.push(value0) }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw when popped', () => {
        expect(() => { f0.pop() }).toThrow(
          'Container is disposed and cannot be used.')
      })
    })

    describe('accessing an indexable container', () => {
      it('should throw when at', () => {
        expect(() => { f0.at(0) }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw when setAt', () => {
        expect(() => { f0.setAt(0, 0, value0) }).toThrow(
          'Container is disposed and cannot be used.')
      })
    })

    describe('accessing a contiguous container', () => {
      it('should throw if expanded', () => {
        expect(() => { f0.expand(1) }).toThrow(
          'Container is disposed and cannot be used.')
      })
      if('should throw if inserted', () => {
        expect(() => { f0.insert(f0.begin(), value0) }).toThrow(
          'Container is disposed and cannot be used.')
      })
      it('should throw if removed', () => {
        expect(() => { f0.remove(f0.begin()) }).toThrow(
          'Container is disposed and cannot be used.')
      })
    })
  })
})
