import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Cursor } from './cursor.js'
import { CursorAbility } from './cursor-abilitiy.js'
import { iterate } from '../algorithm/iterate.js'

import { List } from '../container/sequence/list.js'
import { Chain } from '../container/sequence/rewind/chain.js'
import { Vector } from '../container/sequence/rewind/indexable/vector.js'
import { Deque } from '../container/sequence/rewind/indexable/deque.js'
import { NodeBuffer } from '../container/sequence/rewind/indexable/contiguous/node-buffer.js'
import { EcmaBuffer } from '../container/sequence/rewind/indexable/contiguous/ecma-buffer.js' 

const inputOutput = CursorAbility.Input | CursorAbility.Output

const value0 = 0
const value1 = 1

const cases = [
  ['List', inputOutput | CursorAbility.Forward, List],
  ['Chain', inputOutput | CursorAbility.Bidirectional, Chain],
  ['Vector', inputOutput | CursorAbility.RandomAccess, Vector],
  ['Deque', inputOutput | CursorAbility.RandomAccess, Deque],
  ['NodeBuffer', inputOutput | CursorAbility.Contiguous, NodeBuffer],
  ['EcmaBuffer', inputOutput | CursorAbility.Contiguous, EcmaBuffer],
]

// test the functionality of the cursor container
describe.each(cases)('A %s', (name, abilities, type) => {
  let f0
  beforeEach(() => {
    f0 = new type()
  })
  it('is input iff it reports it is input', () => {
    const isInput = CursorAbility.isInput(abilities)
    expect(f0.isInput).toBe(isInput)
    expect(type.isInput).toBe(isInput)
  })
  it('is output iff it reports it is output', () => {
    const isOutput = CursorAbility.isOutput(abilities)
    expect(f0.isOutput).toBe(isOutput)
    expect(type.isOutput).toBe(isOutput)
  })
  it('is forward iff it reports it is forward', () => {
    const isForward = CursorAbility.isForward(abilities)
    expect(f0.isForward).toBe(isForward)
    expect(type.isForward).toBe(isForward)
  })
  it('is bidirectional iff it reports it is bidirectional', () => {
    const isBidirectional = CursorAbility.isBidirectional(abilities)
    expect(f0.isBidirectional).toBe(isBidirectional)
    expect(type.isBidirectional).toBe(isBidirectional)
  })
  it('is random access iff it reports it is random access', () => {
    const isRandomAccess = CursorAbility.isRandomAccess(abilities)
    expect(f0.isRandomAccess).toBe(isRandomAccess)
    expect(type.isRandomAccess).toBe(isRandomAccess)
  })
  it('is contiguous iff it reports it is contiguous', () => {
    const isContiguous = CursorAbility.isContiguous(abilities)
    expect(f0.isContiguous).toBe(isContiguous)
    expect(type.isContiguous).toBe(isContiguous)
  })
  it('has a cursor type whose prototype extends Cursor', () => {
    expect(f0.cursorType.prototype).toBeInstanceOf(Cursor)
  })
  it('should be empty', () => {
    expect(f0.isEmpty).toBe(true)
  })
  describe('unshift a value', () => {
    beforeEach(() => {
      f0.unshift(value0)
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
        expect(cursor.isEnd).toBe(true)
      })
      it('should not be at the beginning', () => {
        expect(cursor.isBegin).toBe(false)
      })
    })
    describe('begin', () => {
      let cursor
      beforeEach(() => {
        cursor = f0.begin()
      })
      it('should be at the beginning', () => {
        expect(cursor.isBegin).toBe(true)
      })
      it('should not be at the end', () => {
        expect(cursor.isEnd).toBe(false)
      })
      it('should not be read-only', () => {
        expect(cursor.isReadOnly).toBe(false)
      })
      describe('then step', () => {
        let didStep
        beforeEach(() => {
          didStep = cursor.step()
        })
        it('should have stepped', () => {
          expect(didStep).toBe(true)
        })
        it('should be at the end', () => {
          expect(cursor.isEnd).toBe(true)
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
    describe.each([ type.isBidirectional ].filter(Boolean))
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
        it('should throw when interrogated', () => {
          expect(() => { cursor.isBegin }).toThrow(
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
          expect(cursor.isEnd).toBe(true)
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
          expect(didStep).toBe(true)
        })
        it('should be at the end', () => {
          expect(cursor.isEnd).toBe(true)
        })
        describe.each([ type.isRandomAccess ].filter(Boolean))
          ('random access cursor', (isRandomAccess) => {
          
          describe('moved nowhere', () => {
            let moved
            beforeEach(() => {
              moved = cursor.move(0)
            })
            it('should have "moved"', () => {
              expect(moved).toBe(true)
            })
            it('should still be at the end', () => {
              expect(cursor.isEnd).toBe(true)
            })
          })
          describe('moved back', () => {
            let movedBack
            beforeEach(() => {
              movedBack = cursor.move(-1)
            })
            it('should have moved', () => {
              expect(movedBack).toBe(true)
            })
            it('should be at the beginning', () => {
              expect(cursor.isBegin).toBe(true)
            })
            describe('then moved forward', () => {
              let movedForward
              beforeEach(() => {
                movedForward = cursor.move(1)
              })
              it('should have moved forward', () => {
                expect(movedForward).toBe(true)
              })
              it('should be at the end', () => {
                expect(cursor.isEnd).toBe(true)
              })
            })
          })
        })
        describe.each([ type.isBidirectional ].filter(Boolean))
          ('bidirectional cursor', (isBidirectional) => {

          it('should be able to step back', () => {
            const didStepBack = cursor.stepBack()
            expect(didStepBack).toBe(true)
            expect(cursor.isBegin).toBe(true)
          })
        })
      })
    })
  })
})
