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

  OtherTrivialCursor,
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
  beforeEach(() => {
    const container0 = new type()
    const container1 = new type()
    begin = container0.begin()
    end = container0.end()
    begin0 = () => container0.begin()
    end0 = () => container0.end()
    begin1 = () => container1.begin()
  })
  it('should be a cursor concept', () => {
    expect(begin).toBeInstanceOf(CursorConcept)
  })
  it('should satisfy concepts', () => {
    for (const concept of concepts) {
      expect(begin).toBeInstanceOf(concept)
    }
  })
  it('should throw on step', () => {
    expect(() => end.step()).toThrow(
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

  // operations that throw if cursor does not support them
  it('should throw read out of bounds if read', () => {
    if (!(begin instanceof InputCursorConcept)) return
    expect(() => begin.value).toThrow(
      'Cannot read value out of bounds of cursor.'
    )
  })
  it('should throw on next', () => { 
    if (!(begin instanceof InputCursorConcept)) return
    expect(() => end.next()).toThrow(
      "Cannot read value out of bounds of cursor."
    )
  })
  it('should throw RangeError if set', () => {
    if (!(begin instanceof OutputCursorConcept)) return
    expect(() => begin.value = 42).toThrow(RangeError)
  })
  it('should be equal to its clone', () => {
    if (!(begin instanceof ForwardCursorConcept)) return
    const clone = begin.clone()
    expect(begin.equals(clone)).toBe(true)
  })
  // it('should throw on stepBack', () => {
  //   if (!(begin instanceof BidirectionalCursorConcept)) return
  //   expect(() => begin.stepBack()).toThrow(
  //     "Cannot move cursor out of bounds."
  //   )
  // })
  it('should throw if moving forward', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.move(1)).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
  it('should throw if moving backward', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.move(-1)).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
  it('should return true if moving 0', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(begin.move(0)).toBe(begin)
  })
  it('should throw at 0', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.at(0)).toThrow(
      "Cannot read value out of bounds of cursor."
    )
  })
  it('should throw if set at offset', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.setAt(0, 42)).toThrow(RangeError)
  })
  it('should return 0 on subtract', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(begin.subtract(begin)).toBe(0)
  })
  it('should throw if subtracting null', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.subtract(null)).toThrow(
      "Cursor is from another container."
    )
  })
  it('should return 0 on compareTo', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(begin.compareTo(begin)).toBe(0)
  })
  it('should throw if compared to null', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.compareTo(null)).toThrow(
      "Cursor is from another container."
    )
  })
  it('should throw RangeError on read 1', () => {
    if (!(begin instanceof ContiguousCursorConcept)) return
    expect(() => begin.read(1)).toThrow(RangeError)
  })
  it('should throw RangeError on read 2', () => {
    if (!(begin instanceof ContiguousCursorConcept)) return
    expect(() => begin.read(2)).toThrow(RangeError)
  })
  it('should throw RangeError on read 4', () => {
    if (!(begin instanceof ContiguousCursorConcept)) return
    expect(() => begin.read(4)).toThrow(RangeError)
  })
  it('should throw on read 8', () => {
    if (!(begin instanceof ContiguousCursorConcept)) return
    expect(() => begin.read(8)).toThrow(Error)
  })
  it('should throw for named reads (e.g. readUInt8)', () => {
    if (!(begin instanceof ContiguousCursorConcept)) return
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
    if (!(begin instanceof ContiguousCursorConcept)) return
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
    if (!(begin instanceof ContiguousCursorConcept)) return
    expect(() => begin.data(null)).toThrow(
      "Cursor is from another container."
    )
  })

  // describe.each([ hasProxy ].filter(Boolean))('that is stale', (useProxy) => {
  //   beforeEach(() => {
  //     container.__version$ = 1
  //   })
  //   it('should throw cursor is stale on method call (step)', () => {
  //     expect(() => begin.step()).toThrow(
  //       "Cursor is stale and cannot be used."
  //     )
  //   })
  //   it('should throw cursor is stale on property access (abilities)', () => {
  //     expect(() => begin.abilities).toThrow(
  //       "Cursor is stale and cannot be used."
  //     )
  //   })
  // })
  describe('and another cursor from a different container', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = begin1()
    })
    it('should not be equatable', () => {
      expect(begin.equatableTo(otherCursor)).toBe(false)
    })
    it('should not be equal', () => {
      expect(begin.equals(otherCursor)).toBe(false)
    })
  })
  describe('and another cursor', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = begin0()
    })
    it('should be equal', () => {
      expect(begin.equals(otherCursor)).toBe(true)
    })
    it('should be equatable', () => {
      expect(begin.equatableTo(otherCursor)).toBe(true)
    })
    it('should compare equal', () => {
      if (!(begin instanceof RandomAccessCursorConcept)) return
      expect(begin.compareTo(otherCursor)).toBe(0)
    })
    it('should subtract to zero', () => {
      if (!(begin instanceof RandomAccessCursorConcept)) return
      expect(begin.subtract(otherCursor)).toBe(0)
    })
    it('should return an empty buffer for data', () => {
      if (!(begin instanceof ContiguousCursorConcept)) return
      const buffer = begin.data(otherCursor)

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
  describe('and another cursor of different type', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = new OtherTrivialCursor()
    })
    it('should not be equatable', () => {
      expect(begin.equatableTo(otherCursor)).toBe(false)
    })
    it('should not be equal', () => {
      expect(begin.equals(otherCursor)).toBe(false)
    })
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
    it('should throw data with other cursor', () => {
      if (!(begin instanceof ContiguousCursorConcept)) return
      expect(() => begin.data(otherCursor)).toThrow(
        "Cursor is from another container."
      )
    })
  })
})

  