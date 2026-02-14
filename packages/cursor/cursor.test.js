import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { 
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from './cursor-concepts.js'

import {
  TrivialInputContainer,
  TrivialOutputContainer,
  TrivialMutableContainer,
  TrivialForwardContainer,
  TrivialBidirectionalContainer,
  TrivialRandomAccessContainer,
  TrivialContiguousContainer,
  TrivialOtherContainer,
} from './trivial-cursors.js'

import { 
  List,
  Chain,
  Vector,
  Deque,
  NodeBuffer,
  EcmaBuffer 
} from '@kingjs/cursor-container'

const TrivialInputContainerCase = {
  type: TrivialInputContainer,
  concepts: [InputCursorConcept],
}
const TrivialOutputContainerCase = {
  type: TrivialOutputContainer,
  concepts: [OutputCursorConcept],
}
const TrivialMutableContainerCase = {
  type: TrivialMutableContainer,
  concepts: [InputCursorConcept, OutputCursorConcept],
}
const TrivialForwardContainerCase = {
  type: TrivialForwardContainer,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept],
}
const TrivialBidirectionalContainerCase = {
  type: TrivialBidirectionalContainer,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept],
}
const TrivialRandomAccessContainerCase = {
  type: TrivialRandomAccessContainer,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept],
}
const TrivialContiguousContainerCase = {
  type: TrivialContiguousContainer,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept,
    ContiguousCursorConcept],
}
const ListCase = {
  type: List,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept],
}
const ChainCase = {
  type: Chain,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept],
}
const VectorCase = {
  type: Vector,
  concepts: [
    InputCursorConcept,
    OutputCursorConcept,
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept],
}
const DequeCase = {
  type: Deque,
  concepts: [
    InputCursorConcept,
    OutputCursorConcept,
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept],
}
const NodeBufferCase = {
  type: NodeBuffer,
  concepts: [
    InputCursorConcept,
    OutputCursorConcept,
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept,
    ContiguousCursorConcept],
}
const EcmaBufferCase = {
  type: EcmaBuffer,
  concepts: [
    InputCursorConcept,
    OutputCursorConcept,
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept,
    ContiguousCursorConcept],
}

const cases = [
  ['TrivialCursor', TrivialInputContainerCase],
  ['TrivialOutputCursor', TrivialOutputContainerCase],
  ['TrivialMutableCursor', TrivialMutableContainerCase],
  ['TrivialForwardCursor', TrivialForwardContainerCase],
  ['TrivialBidirectionalCursor', TrivialBidirectionalContainerCase],
  ['TrivialRandomAccessCursor', TrivialRandomAccessContainerCase],
  ['TrivialContiguousCursor', TrivialContiguousContainerCase],
  ['List', ListCase],
  ['Chain', ChainCase],
  ['Vector', VectorCase],
  ['Deque', DequeCase],
  ['NodeBuffer', NodeBufferCase],
  ['EcmaBuffer', EcmaBufferCase],
]

describe.each(cases)('%s', (_, { type, concepts }) => {
  let begin0, end0, begin1
  let begin, end
  let cursorType, cursorPrototype
  beforeEach(() => {
    // const container0 = new type()
    // const container1 = new type()
    // begin = container0.begin()
    // end = container0.end()
    // begin0 = () => container0.begin()
    // end0 = () => container0.end()
    // begin1 = () => container1.begin()

    cursorType = type.cursorType
    cursorPrototype = cursorType.prototype
  })

  it('should satisfy concepts', () => {
    expect(cursorPrototype).toBeInstanceOf(CursorConcept)
    for (const concept of concepts) {
      expect(cursorPrototype).toBeInstanceOf(concept)
    }
  })

  describe('uses a container factory to activate itself', () => {
    let container
    let begin

    beforeEach(() => {
      container = new type()
      begin = container.begin()
    })

    describe('cursor', () => {
      it('should throw on step', () => {
        expect(() => begin.step()).toThrow(
          "Cannot move cursor out of bounds."
        )
      })
      it('should be equatable to itself', () => {
        expect(begin.equatableTo(begin)).toBe(true)
      })
      it('should not be equatable to null', () => {
        expect(begin.equatableTo(null)).toBe(false)
      })
      it('should equal itself', () => {
        expect(begin.equals(begin)).toBe(true)
      })
      it('should not be equal to null', () => {
        expect(begin.equals(null)).toBe(false)
      })
    })

    if (concepts.includes(InputCursorConcept)) {
      describe('as an input cursor', () => {
        it('should throw read out of bounds if read', () => {
          expect(() => begin.value).toThrow(
            'Cannot read value out of bounds of cursor.'
          )
        })
        it('should throw on next', () => { 
          expect(() => begin.next()).toThrow(
            "Cannot read value out of bounds of cursor."
          )
        })
      })
    }
  
    if (concepts.includes(OutputCursorConcept)) {
      describe('as an output cursor', () => {
        it('should throw RangeError if set', () => {
          if (!(begin instanceof OutputCursorConcept)) return
          expect(() => begin.value = 42).toThrow(RangeError)
        })
      })
    }
  
    if (concepts.includes(ForwardCursorConcept)) {
      describe('as a forward cursor', () => {
        it('should be equal to its clone', () => {
          const clone = begin.clone()
          expect(begin.equals(clone)).toBe(true)
        })
      })
    }
  
    if (concepts.includes(BidirectionalCursorConcept)) {
      describe('as a bidirectional cursor', () => {
        it('should throw on stepBack', () => {
          expect(() => {
            begin.stepBack()
            begin.stepBack()
          }).toThrow("Cannot move cursor out of bounds.")
        })
      })
    }
  
    if (concepts.includes(RandomAccessCursorConcept)) {
      describe('as a random access cursor', () => {
        it('should throw if moving forward', () => {
          expect(() => begin.move(1)).toThrow(
            "Cannot move cursor out of bounds."
          )
        })
        it('should throw if moving backward', () => {
          expect(() => begin.move(-1)).toThrow(
            "Cannot move cursor out of bounds."
          )
        })
        it('should return true if moving 0', () => {
          expect(begin.move(0)).toBe(begin)
        })
        it('should throw at 0', () => {
          expect(() => begin.at(0)).toThrow(
            "Cannot read value out of bounds of cursor."
          )
        })
        it('should throw if set at offset', () => {
          expect(() => begin.setAt(0, 42)).toThrow(RangeError)
        })
        it('should return 0 on subtract', () => {
          expect(begin.subtract(begin)).toBe(0)
        })
        it('should throw if subtracting null', () => {
          expect(() => begin.subtract(null)).toThrow(
            "Cursor is from another container.")
        })
        it('should return 0 on compareTo', () => {
          expect(begin.compareTo(begin)).toBe(0)
        })
        it('should throw if compared to null', () => {
          expect(() => begin.compareTo(null)).toThrow(
            "Cursor is from another container."
          )
        })
      })
    }
    
    if (concepts.includes(ContiguousCursorConcept)) {
      describe('as a contiguous cursor', () => {
        it('should throw RangeError on read 1', () => {
          expect(() => begin.read(1)).toThrow(RangeError)
        })
        it('should throw RangeError on read 2', () => {
          expect(() => begin.read(2)).toThrow(RangeError)
        })
        it('should throw RangeError on read 4', () => {
          expect(() => begin.read(4)).toThrow(RangeError)
        })
        it('should throw on read 8', () => {
          expect(() => begin.read(8)).toThrow(Error)
        })
        it('should throw for named reads (e.g. readUInt8)', () => {
          expect(() => begin.readUInt8()).toThrow(RangeError)
          expect(() => begin.readInt8()).toThrow(RangeError)
      
          expect(() => begin.readUInt16()).toThrow(RangeError)
          expect(() => begin.readUInt16BE()).toThrow(RangeError)
          expect(() => begin.readUInt16LE()).toThrow(RangeError)
      
          expect(() => begin.readInt16()).toThrow(RangeError)
          expect(() => begin.readInt16BE()).toThrow(RangeError)
          expect(() => begin.readInt16LE()).toThrow(RangeError)
      
          expect(() => begin.readUInt32()).toThrow(RangeError)
          expect(() => begin.readUInt32BE()).toThrow(RangeError)
          expect(() => begin.readUInt32LE()).toThrow(RangeError)
      
          expect(() => begin.readInt32()).toThrow(RangeError)
          expect(() => begin.readInt32BE()).toThrow(RangeError)
          expect(() => begin.readInt32LE()).toThrow(RangeError)
        })
        it('should return an empty buffer for data', () => {
          const buffer = begin.data(begin)
      
          if (Buffer.isBuffer(buffer)) {
            expect(buffer.length).toBe(0)
          }
          else if (buffer instanceof DataView) {
            expect(buffer.byteLength).toBe(0)
          } else {
            throw new Error("data() did not return a Buffer or DataView.")
          }
        })
        it('should throw if data called with null cursor', () => {
          expect(() => begin.data(null)).toThrow(
            "Cursor is from another container."
          )
        })
      })
    }

    describe('and another cursor', () => {
      let otherBegin
      beforeEach(() => {
        otherBegin = container.begin()
      })
      it('should be equal', () => {
        expect(begin.equals(otherBegin)).toBe(true)
      })
      it('should be equatable', () => {
        expect(begin.equatableTo(otherBegin)).toBe(true)
      })
      if (concepts.includes(RandomAccessCursorConcept)) {
        describe('as a random access cursor', () => {
          it('should compare equal', () => {
            expect(begin.compareTo(otherBegin)).toBe(0)
          })
          it('should subtract to zero', () => {
            expect(begin.subtract(otherBegin)).toBe(0)
          })
        })
      }
      if (concepts.includes(ContiguousCursorConcept)) {
        describe('as a contiguous cursor', () => {
          it('should return an empty buffer for data', () => {
            if (!(begin instanceof ContiguousCursorConcept)) return
            const buffer = begin.data(otherBegin)
    
            if (Buffer.isBuffer(buffer)) {
              expect(buffer.length).toBe(0)
            }
            else if (buffer instanceof DataView) {
              expect(buffer.byteLength).toBe(0)
            } else {
              throw new Error("data() did not return a Buffer or DataView.")
            }
          })
        })
      }
    })
    
    describe('and another cursor from a different container', () => {
      let otherContainer
      let otherBegin
      beforeEach(() => {
        otherContainer = new type()
        otherBegin = otherContainer.begin()
      })
      it('should not be equatable', () => {
        expect(begin.equatableTo(otherBegin)).toBe(false)
      })
      it('should not be equal', () => {
        expect(begin.equals(otherBegin)).toBe(false)
      })
    })
  
    describe('and another cursor from a different type of container', () => {
      let otherContainer
      let otherCursor
      beforeEach(() => {
        otherContainer = new TrivialOtherContainer()
        otherCursor = otherContainer.begin()
      })
      it('should not be equatable', () => {
        expect(begin.equatableTo(otherCursor)).toBe(false)
      })
      it('should not be equal', () => {
        expect(begin.equals(otherCursor)).toBe(false)
      })

      if (concepts.includes(RandomAccessCursorConcept)) {
        describe('as a random access cursor', () => {
          it('should throw subtracting from other cursor', () => {
            if (!(begin instanceof RandomAccessCursorConcept)) return
            expect(() => begin.subtract(otherCursor)).toThrow(
              "Cursor is from another container."
            )
          })
          it('should throw comparing to other cursor', () => {
            if (!(begin instanceof RandomAccessCursorConcept)) return
            expect(() => begin.compareTo(otherCursor)).toThrow(
              "Cursor is from another container."
            )
          })
        })
      }

      if (concepts.includes(ContiguousCursorConcept)) {
        describe('as a contiguous cursor', () => {
          it('should throw data with other cursor', () => {
            if (!(begin instanceof ContiguousCursorConcept)) return
            expect(() => begin.data(otherCursor)).toThrow(
              "Cursor is from another container."
            )
          })
        })
      }
    })
  })
})

  