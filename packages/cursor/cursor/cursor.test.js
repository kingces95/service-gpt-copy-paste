import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Cursor } from './cursor.js'
import { CursorAbility } from './cursor-abilitiy.js'

import { List } from '../container/sequence/list.js'
import { Chain } from '../container/sequence/rewind/chain.js'
import { Vector } from '../container/sequence/rewind/indexable/vector.js'
import { Deque } from '../container/sequence/rewind/indexable/deque.js'
import { NodeBuffer } from '../container/sequence/rewind/indexable/contiguous/node-buffer.js'
import { EcmaBuffer } from '../container/sequence/rewind/indexable/contiguous/ecma-buffer.js' 

// For testing purposes, we define a set of trivial cursor implementations
// which are are always empty and do not move but which claim to be input,
// output, forward, bidirectional, random access, and contiguous.

const inputOutput = CursorAbility.Input | CursorAbility.Output

class TrivialCursor extends Cursor {
  static get abilities() { return Cursor.Ability.None }
  constructor(id) {
    super()
    this.id = id
  }
  get isEnd$() { return true }
  get isBegin$() { return true }
  get value$() { return undefined }
  set value$(value) { throw new RangeError() }
  step$() { return false }
  equals$(other) { return true }
  equatableTo$(other) { return this.id == other.id }
}

class TrivialInputCursor extends TrivialCursor {
  static get abilities() { return Cursor.Ability.Input }
}

class TrivialOutputCursor extends TrivialCursor {
  static get abilities() { return Cursor.Ability.Output }
}

class TrivialForwardCursor extends TrivialCursor {
  static get abilities() { return inputOutput | Cursor.Ability.Forward }
  clone$() { return new this.constructor() }
}

class TrivialBidirectionalCursor extends TrivialForwardCursor {
  static get abilities() { return inputOutput | Cursor.Ability.Bidirectional }
  stepBack$() { return false }
}

class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
  static get abilities() { return inputOutput | Cursor.Ability.RandomAccess }
  move$(offset) { 
    if (offset === 0) return true
    return false
  }
  at$(offset) { return undefined }
  setAt$(offset, value) { throw new RangeError() }
  subtract$(other) { return 0 }
  compareTo$(other) { return 0 }
}

class TrivialContiguousCursor extends TrivialRandomAccessCursor {
  static get abilities() { return inputOutput | Cursor.Ability.Contiguous }
  readAt$(offset = 0, length = 1, signed = false, littleEndian = false) { 
    throw new RangeError()
  }  
  data$(other) { 
    return Buffer.alloc(0)
  }
}

class OtherTrivialCursor extends TrivialCursor { }

function expectAbilityException(cursor, fn, ability, error) {
  if ((cursor.abilities & ability) != ability) {
    expect(fn).toThrow(error)
    return true
  }
  return false
}
function expectNotAnOutputCursor(cursor, fn) {
  return expectAbilityException(cursor, fn, Cursor.Ability.Output, 
    "Operation requires an output cursor.")
}
function expectNotAnInputCursor(cursor, fn) {
  return expectAbilityException(cursor, fn, Cursor.Ability.Input,
    "Operation requires an input cursor.")
}
function expectNotAForwardCursor(cursor, fn) {
  return expectAbilityException(cursor, fn, Cursor.Ability.Forward,
    "Operation requires a forward cursor.")
}
function expectNotABidirectionalCursor(cursor, fn) {
  return expectAbilityException(cursor, fn, Cursor.Ability.Bidirectional,
    "Operation requires a bidirectional cursor.")
}
function expectNotARandomAccessCursor(cursor, fn) {
  return expectAbilityException(cursor, fn, Cursor.Ability.RandomAccess,
    "Operation requires a random access cursor.")
}
function expectNotAContiguousCursor(cursor, fn) {
  return expectAbilityException(cursor, fn, Cursor.Ability.Contiguous,
    "Operation requires a contiguous cursor.")
} 

const list0 = new List(), list1 = new List()
const chain0 = new Chain(), chain1 = new Chain()
const vector0 = new Vector(), vector1 = new Vector()
const deque0 = new Deque(), deque1 = new Deque()
const nodeBuffer0 = new NodeBuffer(), nodeBuffer1 = new NodeBuffer()
const ecmaBuffer0 = new EcmaBuffer(), ecmaBuffer1 = new EcmaBuffer()

const cases = [
  ['TrivialCursor', CursorAbility.None,
    () => new TrivialCursor(), 
    () => new TrivialCursor(1)],
  ['TrivialInputCursor', CursorAbility.Input,
    () => new TrivialInputCursor(), 
    () => new TrivialInputCursor(1)],
  ['TrivialOutputCursor', CursorAbility.Output,
    () => new TrivialOutputCursor(), 
    () => new TrivialOutputCursor(1)],
  ['TrivialForwardCursor', inputOutput | CursorAbility.Forward,
    () => new TrivialForwardCursor(), 
    () => new TrivialForwardCursor(1)],
  ['TrivialBidirectionalCursor', inputOutput | CursorAbility.Bidirectional, 
    () => new TrivialBidirectionalCursor(), 
    () => new TrivialBidirectionalCursor(1)],
  ['TrivialRandomAccessCursor', inputOutput | CursorAbility.RandomAccess,
    () => new TrivialRandomAccessCursor(), 
    () => new TrivialRandomAccessCursor(1)],
  ['TrivialContiguousCursor', inputOutput | CursorAbility.Contiguous,
    () => new TrivialContiguousCursor(), 
    () => new TrivialContiguousCursor(1)],

  ['List', inputOutput | CursorAbility.Forward,
    () => list0.end(), () => list1.end()],
  ['Chain', inputOutput | CursorAbility.Bidirectional,
    () => chain0.end(), () => chain1.end()],
  ['Vector', inputOutput | CursorAbility.RandomAccess,
    () => vector0.end(), () => vector1.end()],
  ['Deque', inputOutput | CursorAbility.RandomAccess,
    () => deque0.end(), () => deque1.end()],
  ['NodeBuffer', inputOutput | CursorAbility.Contiguous,
    () => nodeBuffer0.end(), () => nodeBuffer1.end()],
  ['EcmaBuffer', inputOutput | CursorAbility.Contiguous,
    () => ecmaBuffer0.end(), () => ecmaBuffer1.end()],
]

describe.each(cases)('A %s', (name, abilities, fn0, fn1) => {
  let cursor
  beforeEach(() => {
    cursor = fn0()
  })
  it('should be a cursor', () => {
    expect(cursor).toBeInstanceOf(Cursor)
  })
  it('should have abilities', () => {
    expect(cursor.abilities).toBe(abilities)
  })
  it('should be begin', () => {
    expect(cursor.isBegin).toBe(true)
  })
  it('should be end', () => {
    expect(cursor.isEnd).toBe(true)
  })
  it('should not be read-only', () => {
    expect(cursor.isReadOnly).toBe(false)
  })
  it('should return false on step', () => {
    expect(cursor.step()).toBe(false)
  })
  it('should be equatable to itself', () => {
    expect(cursor.equatableTo(cursor)).toBe(true)
  })
  it('should not be equatable to null', () => {
    expect(cursor.equatableTo(null)).toBe(false)
  })
  it('should equal itself', () => {
    expect(cursor.equals(cursor)).toBe(true)
  })
  it('should throw if compared to null', () => {
    expect(() => cursor.equals(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })

  // operations that throw if cursor does not support them
  it('should have undefined value', () => {
    if (expectNotAnInputCursor(cursor, () => cursor.value)) return
    expect(cursor.value).toBeUndefined()
  })
  it('should return undefined on next', () => { 
    if (expectNotAnInputCursor(cursor, () => cursor.value)) return
    expect(cursor.next()).toBeUndefined()
  })
  it('should throw RangeError if set', () => {
    if (expectNotAnOutputCursor(cursor, () => cursor.value = 42)) return
    expect(() => cursor.value = 42).toThrow(RangeError)
  })
  it('should be equal to its clone', () => {
    if (expectNotAForwardCursor(cursor, () => cursor.clone())) return
    const clone = cursor.clone()
    expect(cursor.equals(clone)).toBe(true)
  })
  it('should return false on stepBack', () => {
    if (expectNotABidirectionalCursor(cursor, () => cursor.stepBack())) return
    expect(cursor.stepBack()).toBe(false)
  })
  it('should return false if moving forward', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.move(1))) return
    expect(cursor.move(1)).toBe(false)
  })
  it('should return false if moving backward', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.move(-1))) return
    expect(cursor.move(-1)).toBe(false)
  })
  it('should return true if moving 0', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.move(0))) return
    expect(cursor.move(0)).toBe(true)
  })
  it('should return undefined on at', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.at(0))) return
    expect(cursor.at(0)).toBeUndefined()
  })
  it('should throw if set at offset', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.setAt(0, 42))) return
    expect(() => cursor.setAt(0, 42)).toThrow(RangeError)
  })
  it('should return 0 on subtract', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.subtract(cursor))) return
    expect(cursor.subtract(cursor)).toBe(0)
  })
  it('should throw if subtracting null', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.subtract(null))) return
    expect(() => cursor.subtract(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })
  it('should return 0 on compareTo', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.compareTo(cursor))) return
    expect(cursor.compareTo(cursor)).toBe(0)
  })
  it('should throw if compared to null', () => {
    if (expectNotARandomAccessCursor(cursor, () => cursor.compareTo(null))) return
    expect(() => cursor.compareTo(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })
  it('should throw RangeError on read 1', () => {
    if (expectNotAContiguousCursor(cursor, () => cursor.read())) return
    expect(() => cursor.read(1)).toThrow(RangeError)
  })
  it('should throw RangeError on read 2', () => {
    if (expectNotAContiguousCursor(cursor, () => cursor.read(2))) return
    expect(() => cursor.read(2)).toThrow(RangeError)
  })
  it('should throw RangeError on read 4', () => {
    if (expectNotAContiguousCursor(cursor, () => cursor.read(4))) return
    expect(() => cursor.read(4)).toThrow(RangeError)
  })
  it('should throw on read 8', () => {
    if (expectNotAContiguousCursor(cursor, () => cursor.read(8))) return
    expect(() => cursor.read(8)).toThrow(Error)
  })
  it('should throw for named reads (e.g. readUInt8)', () => {
    if (expectNotAContiguousCursor(cursor, () => cursor.readUInt8())) return
    expect(() => cursor.readUInt8()).toThrow(RangeError)
    expect(() => cursor.readInt8()).toThrow(RangeError)

    expect(() => cursor.readUInt16()).toThrow(RangeError)
    expect(() => cursor.readUInt16BE()).toThrow(RangeError)
    expect(() => cursor.readUInt16LE()).toThrow(RangeError)

    expect(() => cursor.readInt16()).toThrow(RangeError)
    expect(() => cursor.readInt16BE()).toThrow(RangeError)
    expect(() => cursor.readInt16LE()).toThrow(RangeError)

    expect(() => cursor.readUInt32()).toThrow(RangeError)
    expect(() => cursor.readUInt32BE()).toThrow(RangeError)
    expect(() => cursor.readUInt32LE()).toThrow(RangeError)

    expect(() => cursor.readInt32()).toThrow(RangeError)
    expect(() => cursor.readInt32BE()).toThrow(RangeError)
    expect(() => cursor.readInt32LE()).toThrow(RangeError)
  })
  it('should return an empty buffer for data', () => {
    if (expectNotAContiguousCursor(cursor, () => cursor.data())) return
    const buffer = cursor.data(cursor)

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
    if (expectNotAContiguousCursor(cursor, () => cursor.data(null))) return
    expect(() => cursor.data(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })

  describe('and another cursor from a different container', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = fn1()
    })
    it('should not be equatable', () => {
      expect(cursor.equatableTo(otherCursor)).toBe(false)
    })
  })
  describe('and another cursor', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = fn0()
    })
    it('should be equal', () => {
      expect(cursor.equals(otherCursor)).toBe(true)
    })
    it('should be equatable', () => {
      expect(cursor.equatableTo(otherCursor)).toBe(true)
    })
    it('should compare equal', () => {
      if (expectNotARandomAccessCursor(cursor, () => cursor.compareTo(otherCursor))) return
      expect(cursor.compareTo(otherCursor)).toBe(0)
    })
    it('should subtract to zero', () => {
      if (expectNotARandomAccessCursor(cursor, () => cursor.subtract(otherCursor))) return
      expect(cursor.subtract(otherCursor)).toBe(0)
    })
    it('should return an empty buffer for data', () => {
      if (expectNotAContiguousCursor(cursor, () => cursor.data())) return
      const buffer = cursor.data(otherCursor)

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
        cursor.isReadOnly = true
      })
      it('should not be equatable', () => {
        expect(cursor.equatableTo(otherCursor)).toBe(false)
      })
      it('should throw not equatable on equals', () => {
        expect(() => cursor.equals(otherCursor)).toThrow(
          "Cursor is not equatable to the other cursor."
        )
      })
    })
  })
  describe('and another cursor of different type', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = new OtherTrivialCursor()
    })
    it('should not be equatable', () => {
      expect(cursor.equatableTo(otherCursor)).toBe(false)
    })
    it('should throw testing equality', () => {
      expect(() => cursor.equals(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw subtracting from other cursor', () => {
      if (expectNotARandomAccessCursor(cursor, () => cursor.subtract(otherCursor))) return
      expect(() => cursor.subtract(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw comparing to other cursor', () => {
      if (expectNotARandomAccessCursor(cursor, () => cursor.compareTo(otherCursor))) return
      expect(() => cursor.compareTo(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw data with other cursor', () => {
      if (expectNotAContiguousCursor(cursor, () => cursor.data(otherCursor))) return
      expect(() => cursor.data(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
  })
  describe('made read-only', () => {
    beforeEach(() => {
      cursor.isReadOnly = true
    })
    it('should be read-only', () => {
      expect(cursor.isReadOnly).toBe(true)
    })
    it('should not have output ability', () => {
      expect(cursor.abilities & Cursor.Ability.Output).toBe(0)
    })
    it('should throw if isReadOnly set with non-boolean', () => {
      expect(() => cursor.isReadOnly = 'true').toThrow(
        "isReadOnly must be a boolean."
      )
    })
    it('should throw if isReadOnly set to true', () => {
      expect(() => cursor.isReadOnly = false).toThrow(
        "Cannot make read-only cursor writable."
      )
    })
    it('should not allow value to be set', () => {
      expect(() => cursor.value = 42).toThrow(
        "Cursor is read-only."
      )
    })
    it('should not be allowed to set value at offset', () => {
      if (expectNotARandomAccessCursor(cursor, () => cursor.setAt(0, 42))) return
      expect(() => cursor.setAt(0, 42)).toThrow(
        "Cursor is read-only."
      )
    })
  })
})

  