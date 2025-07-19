import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Cursor } from './cursor.js'
import { implement } from '../concept.js'
import { 
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from './cursor-concepts.js'
import {
  throwMoveOutOfBounds,
} from '../throw.js'

import { List } from '../container/sequence/list.js'
import { Chain } from '../container/sequence/rewind/chain.js'
import { Vector } from '../container/sequence/rewind/indexable/vector.js'
import { Deque } from '../container/sequence/rewind/indexable/deque.js'
import { NodeBuffer } from '../container/sequence/rewind/indexable/contiguous/node-buffer.js'
import { EcmaBuffer } from '../container/sequence/rewind/indexable/contiguous/ecma-buffer.js' 
import { InputCursorConcept } from './cursor-concepts.js'

// For testing purposes, we define a set of trivial cursor implementations
// which are are always empty and do not move but which claim to be input,
// output, forward, bidirectional, random access, and contiguous.

class TrivialCursor extends Cursor {
  static { implement(this, CursorConcept) }
  
  constructor(id) {
    super()
    this.id = id
  }
  get __isActive$() { return true }
  step$() { throwMoveOutOfBounds() }
  equals$(other) { return true }
  equatableTo$(other) { return this.id == other.id }
}

class TrivialInputCursor extends TrivialCursor {
  static { implement(this, InputCursorConcept) }
  get value$() { return undefined }
  get value() { return this.value$ }
}

class TrivialOutputCursor extends TrivialCursor {
  static { implement(this, OutputCursorConcept) }
  set value$(value) { throw new RangeError() }
  set value(value) { this.value$ = value }
}

class TrivialMutableCursor extends TrivialCursor {
  static { implement(this, TrivialInputCursor, TrivialOutputCursor) }
  get value$() { return undefined }
  get value() { return this.value$ }
  set value$(value) { throw new RangeError() }
  set value(value) { this.value$ = value }
}

class TrivialForwardCursor extends TrivialMutableCursor {
  static { implement(this, ForwardCursorConcept) }
  clone$() { return new this.constructor() }
  clone() { return this.clone$() }
}

class TrivialBidirectionalCursor extends TrivialForwardCursor {
  static { implement(this, BidirectionalCursorConcept) }
  stepBack$() { throwMoveOutOfBounds() }
  stepBack() { return this.stepBack$() }
}

class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
  static { implement(this, RandomAccessCursorConcept) }
  move$(offset) { 
    if (offset === 0) return true
    throwMoveOutOfBounds()
  }
  at$(offset) { return undefined }
  setAt$(offset, value) { throw new RangeError() }
  subtract$(other) { return 0 }
  compareTo$(other) { return 0 }

  move(offset) { return this.move$(offset) }
  at(offset) { return this.at$(offset) }
  setAt(offset, value) { this.setAt$(offset, value) }
  subtract(other) { return this.subtract$(other) }
  compareTo(other) { return this.compareTo$(other) }
}

class TrivialContiguousCursor extends TrivialRandomAccessCursor {
  static { implement(this, ContiguousCursorConcept) }
  readAt$(offset = 0, length = 1, signed = false, littleEndian = false) { 
    throw new RangeError()
  }  
  data$(other) { 
    return Buffer.alloc(0)
  }

  read(length = 1, signed = false, littleEndian = false) {
    return this.readAt$(0, length, signed, littleEndian)
  }
  data(other) { return this.data$(other) }
}

class OtherTrivialCursor extends TrivialCursor { }

const list0 = new List(), list1 = new List()
const chain0 = new Chain(), chain1 = new Chain()
const vector0 = new Vector(), vector1 = new Vector()
const deque0 = new Deque(), deque1 = new Deque()
const nodeBuffer0 = new NodeBuffer(), nodeBuffer1 = new NodeBuffer()
const ecmaBuffer0 = new EcmaBuffer(), ecmaBuffer1 = new EcmaBuffer()

const cases = [
  ['TrivialCursor', [CursorConcept],
    () => new TrivialCursor(), 
    () => new TrivialCursor(), 
    () => new TrivialCursor(1)],
  ['TrivialInputCursor', [InputCursorConcept],
    () => new TrivialInputCursor(), 
    () => new TrivialInputCursor(), 
    () => new TrivialInputCursor(1)],
  ['TrivialOutputCursor', [OutputCursorConcept],
    () => new TrivialOutputCursor(), 
    () => new TrivialOutputCursor(), 
    () => new TrivialOutputCursor(1)],
  ['TrivialForwardCursor', 
    [InputCursorConcept, OutputCursorConcept, ForwardCursorConcept],
    () => new TrivialForwardCursor(), 
    () => new TrivialForwardCursor(), 
    () => new TrivialForwardCursor(1)],
  ['TrivialBidirectionalCursor', 
    [InputCursorConcept, OutputCursorConcept, BidirectionalCursorConcept], 
    () => new TrivialBidirectionalCursor(), 
    () => new TrivialBidirectionalCursor(), 
    () => new TrivialBidirectionalCursor(1)],
  ['TrivialRandomAccessCursor', 
    [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept],
    () => new TrivialRandomAccessCursor(), 
    () => new TrivialRandomAccessCursor(), 
    () => new TrivialRandomAccessCursor(1)],
  ['TrivialContiguousCursor', 
    [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept],
    () => new TrivialContiguousCursor(), 
    () => new TrivialContiguousCursor(), 
    () => new TrivialContiguousCursor(1)],

  ['List', [InputCursorConcept, OutputCursorConcept, ForwardCursorConcept],
    () => list0.begin(), () => list0.end(), () => list1.begin()],
  ['Chain', [InputCursorConcept, OutputCursorConcept, BidirectionalCursorConcept],
    () => chain0.beforeBegin(), () => chain0.end(), () => chain1.begin()],
  ['Vector', [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept],
    () => vector0.begin(), () => vector0.end(), () => vector1.begin()],
  ['Deque', [InputCursorConcept, OutputCursorConcept, RandomAccessCursorConcept],
    () => deque0.begin(), () => deque0.end(), () => deque1.begin()],
  ['NodeBuffer', [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept],
    () => nodeBuffer0.begin(), () => nodeBuffer0.end(), () => nodeBuffer1.begin()],
  ['EcmaBuffer', [InputCursorConcept, OutputCursorConcept, ContiguousCursorConcept],
    () => ecmaBuffer0.begin(), () => ecmaBuffer0.end(), () => ecmaBuffer1.begin()],
]

describe.each(cases)('%s', (_, concepts, begin0, end0, begin1) => {
  let begin
  let end
  beforeEach(() => {
    begin = begin0()
    end = end0()
  })
  it('should be a cursor', () => {
    expect(begin).toBeInstanceOf(Cursor)
  })
  it('should satisfy concepts', () => {
    for (const concept of concepts) {
      expect(begin).toBeInstanceOf(concept)
    }
  })
  it('should not be read-only', () => {
    expect(begin.isReadOnly).toBe(false)
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
  it('should have undefined value', () => {
    if (!(begin instanceof InputCursorConcept)) return
    expect(begin.value).toBeUndefined()
  })
  it('should throw on next', () => { 
    if (!(begin instanceof InputCursorConcept)) return
    expect(() => end.next()).toThrow(
      "Cannot move cursor out of bounds."
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
  it('should throw on stepBack', () => {
    if (!(begin instanceof BidirectionalCursorConcept)) return
    expect(() => begin.stepBack()).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
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
    expect(begin.move(0)).toBe(true)
  })
  it('should return undefined on at', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(begin.at(0)).toBeUndefined()
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
      "Cursor cannot be null or undefined."
    )
  })
  it('should return 0 on compareTo', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(begin.compareTo(begin)).toBe(0)
  })
  it('should throw if compared to null', () => {
    if (!(begin instanceof RandomAccessCursorConcept)) return
    expect(() => begin.compareTo(null)).toThrow(
      "Cursor cannot be null or undefined."
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
      "Cursor cannot be null or undefined."
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
    describe('made read-only', () => {
      beforeEach(() => {
        begin.isReadOnly = true
      })
      it('should not be equatable', () => {
        expect(begin.equatableTo(otherCursor)).toBe(false)
      })
      it('should not be equal', () => {
        expect(begin.equals(otherCursor)).toBe(false)
      })
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
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw comparing to other cursor', () => {
      if (!(begin instanceof RandomAccessCursorConcept)) return
      expect(() => begin.compareTo(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw data with other cursor', () => {
      if (!(begin instanceof ContiguousCursorConcept)) return
      expect(() => begin.data(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
  })
  describe('made read-only', () => {
    beforeEach(() => {
      begin.isReadOnly = true
    })
    it('should be read-only', () => {
      expect(begin.isReadOnly).toBe(true)
    })
    it('should throw if isReadOnly set with non-boolean', () => {
      expect(() => begin.isReadOnly = 'true').toThrow(
        "isReadOnly must be a boolean."
      )
    })
    it('should throw if isReadOnly set to true', () => {
      expect(() => begin.isReadOnly = false).toThrow(
        "Cannot make read-only cursor writable."
      )
    })
    it('should not allow value to be set', () => {
      expect(() => begin.value = 42).toThrow(
        "Cursor is read-only."
      )
    })
    it('should not be allowed to set value at offset', () => {
      if (!(begin instanceof RandomAccessCursorConcept)) return
      expect(() => begin.setAt(0, 42)).toThrow(
        "Cursor is read-only."
      )
    })
  })
})

  