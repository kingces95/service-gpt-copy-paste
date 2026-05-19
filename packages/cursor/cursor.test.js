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
import { PartialReflect } from '@kingjs/partial-reflect'

import {
  TrivialInputRange,
  TrivialOutputRange,
  TrivialMutableRange,
  TrivialForwardRanged,
  TrivialBidirectionalRange,
  TrivialRandomAccessRange,
  TrivialContiguousRange,
  TrivialOtherRange,
} from './trivial-cursors.js'

import {
  ForwardList,
  List,
  ArrayMap,
  Deque,
  // NodeBuffer,
  // EcmaBuffer,
} from '@kingjs/cursor-container'
import { SnapshotView } from '@kingjs/cursor-view'
import { ForwardRangeConcept } from './range-concepts.js'

const TrivialInputContainerCase = {
  type: TrivialInputRange,
  concepts: [InputCursorConcept],
}
const TrivialOutputContainerCase = {
  type: TrivialOutputRange,
  concepts: [OutputCursorConcept],
}
const TrivialMutableContainerCase = {
  type: TrivialMutableRange,
  concepts: [InputCursorConcept, OutputCursorConcept],
}
const TrivialForwardContainerCase = {
  type: TrivialForwardRanged,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept],
}
const TrivialBidirectionalContainerCase = {
  type: TrivialBidirectionalRange,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept],
}
const TrivialRandomAccessContainerCase = {
  type: TrivialRandomAccessRange,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept],
}
const TrivialContiguousContainerCase = {
  type: TrivialContiguousRange,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept,
    ContiguousCursorConcept],
}
const ForwardListCase = {
  type: ForwardList,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept],
}
const ListCase = {
  type: List,
  concepts: [
    InputCursorConcept, 
    OutputCursorConcept, 
    ForwardCursorConcept,
    BidirectionalCursorConcept],
}
const VectorCase = {
  type: ArrayMap,
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
const SnapshotCase = {
  type: SnapshotView,
  create: () => new SnapshotView([]),
  concepts: [
    InputCursorConcept,
    ForwardCursorConcept,
    BidirectionalCursorConcept,
    RandomAccessCursorConcept],
}
// const NodeBufferCase = {
//   type: NodeBuffer,
//   concepts: [
//     InputCursorConcept,
//     OutputCursorConcept,
//     ForwardCursorConcept,
//     BidirectionalCursorConcept,
//     RandomAccessCursorConcept,
//     ContiguousCursorConcept],
//   bufferType: Buffer,
// }
// const EcmaBufferCase = {
//   type: EcmaBuffer,
//   concepts: [
//     InputCursorConcept,
//     OutputCursorConcept,
//     ForwardCursorConcept,
//     BidirectionalCursorConcept,
//     RandomAccessCursorConcept,
//     ContiguousCursorConcept],
// }


const cases = [
  ['TrivialCursor', TrivialInputContainerCase],
  ['TrivialOutputCursor', TrivialOutputContainerCase],
  ['TrivialMutableCursor', TrivialMutableContainerCase],
  ['TrivialForwardCursor', TrivialForwardContainerCase],
  ['TrivialBidirectionalCursor', TrivialBidirectionalContainerCase],
  ['TrivialRandomAccessCursor', TrivialRandomAccessContainerCase],
  ['TrivialContiguousCursor', TrivialContiguousContainerCase],
  ['ForwardList', ForwardListCase],
  ['List', ListCase],
  ['Vector', VectorCase],
  ['Deque', DequeCase],
  ['Snapshot', SnapshotCase],
  // ['NodeBuffer', NodeBufferCase],
  // ['EcmaBuffer', EcmaBufferCase],
]

describe.each(cases)('%s', (_, { 
  type, 
  create = () => new type(), 
  concepts, 
  bufferType 
}) => {
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

  it('should have a range that is iterable and empty', () => {
    const prototype = PartialReflect.getPrototype(type)
    let container = create()
    const values = [...container]
    expect(values).toEqual([])
  })

  describe('uses a container factory to activate itself', () => {
    let container
    let begin

    beforeEach(() => {
      container = create()
      begin = container.begin()
    })

    describe('cursor', () => {
      it('should be instanceof cursor type', () => {
        expect(begin).toBeInstanceOf(cursorType)
      })
      it('should throw on step', () => {
        expect(() => begin.step()).toThrow(
          "Cannot move cursor out of bounds.")
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
        it('should be instanceof InputCursorConcept', () => {
          expect(begin).toBeInstanceOf(InputCursorConcept)
        })
        it('should throw read out of bounds if read', () => {
          expect(() => begin.value).toThrow(
            'Cannot access value out of bounds of cursor.'
          )
        })
      })
    }
  
    if (concepts.includes(OutputCursorConcept)) {
      describe('as an output cursor', () => {
        it('should be instanceof OutputCursorConcept', () => {
          expect(begin).toBeInstanceOf(OutputCursorConcept)
        })
        it('should throw RangeError if set', () => {
          if (!(begin instanceof OutputCursorConcept)) return
          expect(() => begin.value = 42).toThrow(RangeError)
        })
      })
    }
  
    if (concepts.includes(ForwardCursorConcept)) {
      describe('as a forward cursor', () => {
        it('should be instanceof ForwardCursorConcept', () => {
          expect(begin).toBeInstanceOf(ForwardCursorConcept)
        })
        it('should be equal to its clone', () => {
          const clone = begin.clone()
          expect(begin.equals(clone)).toBe(true)
        })
      })
    }
  
    if (concepts.includes(BidirectionalCursorConcept)) {
      describe('as a bidirectional cursor', () => {
        it('should be instanceof BidirectionalCursorConcept', () => {
          expect(begin).toBeInstanceOf(BidirectionalCursorConcept)
        })
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
        it('should be instanceof RandomAccessCursorConcept', () => {
          expect(begin).toBeInstanceOf(RandomAccessCursorConcept)
        })
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
            "Cannot access value out of bounds of cursor."
          )
        })
        it('should throw if set at offset', () => {
          expect(() => begin.setAt(0, 42)).toThrow(RangeError)
        })
        it('should return 0 on distanceTo', () => {
          expect(begin.distanceTo(begin)).toBe(0)
        })
        it('should throw if subtracting null', () => {
          expect(() => begin.distanceTo(null)).toThrow(
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
        it('should be instanceof ContiguousCursorConcept', () => {
          expect(begin).toBeInstanceOf(ContiguousCursorConcept)
        })
        describe('span', () => {
          let buffer
          beforeEach(() => {
            buffer = begin.span()
          })
          it('should return an empty buffer for span', () => {
            expect(buffer).toBeInstanceOf(Uint8Array)
            expect(buffer.byteLength).toBe(0)
          })
          it('should return the expected buffer type for span', () => {
            expect(buffer instanceof (bufferType || Uint8Array)).toBe(true)
          })
        })
        it('should throw if span called with null cursor', () => {
          expect(() => begin.span(null)).toThrow(
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
          it('should distanceTo to zero', () => {
            expect(begin.distanceTo(otherBegin)).toBe(0)
          })
        })
      }
      if (concepts.includes(ContiguousCursorConcept)) {
        describe('span', () => {
          let buffer
          beforeEach(() => {
            buffer = begin.span(otherBegin)
          })
          it('should return an empty buffer for span', () => {
            expect(buffer).toBeInstanceOf(Uint8Array)
            expect(buffer.byteLength).toBe(0)
          })
          it('should return the expected buffer type for span', () => {
            expect(buffer instanceof (bufferType || Uint8Array)).toBe(true)
          })
        })
      }
    })
    
    describe('and another cursor from a different container', () => {
      let otherContainer
      let otherBegin
      beforeEach(() => {
        otherContainer = create()
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
        otherContainer = new TrivialOtherRange()
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
            expect(() => begin.distanceTo(otherCursor)).toThrow(
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
          it('should throw span with other cursor', () => {
            if (!(begin instanceof ContiguousCursorConcept)) return
            expect(() => begin.span(otherCursor)).toThrow(
              "Cursor is from another container."
            )
          })
        })
      }
    })
  })
})

  
