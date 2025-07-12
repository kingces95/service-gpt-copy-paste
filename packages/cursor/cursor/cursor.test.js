import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Cursor } from './cursor.js'
import { CursorAbility } from './cursor-abilitiy.js'
import {
  throwMoveOutOfBounds,
} from '../throw.js'

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
  get value$() { return undefined }
  set value$(value) { throw new RangeError() }
  step$() { throwMoveOutOfBounds() }
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
  stepBack$() { throwMoveOutOfBounds() }
}

class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
  static get abilities() { return inputOutput | Cursor.Ability.RandomAccess }
  move$(offset) { 
    if (offset === 0) return true
    throwMoveOutOfBounds()
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
    () => new TrivialCursor(), 
    () => new TrivialCursor(1)],
  ['TrivialInputCursor', CursorAbility.Input,
    () => new TrivialInputCursor(), 
    () => new TrivialInputCursor(), 
    () => new TrivialInputCursor(1)],
  ['TrivialOutputCursor', CursorAbility.Output,
    () => new TrivialOutputCursor(), 
    () => new TrivialOutputCursor(), 
    () => new TrivialOutputCursor(1)],
  ['TrivialForwardCursor', inputOutput | CursorAbility.Forward,
    () => new TrivialForwardCursor(), 
    () => new TrivialForwardCursor(), 
    () => new TrivialForwardCursor(1)],
  ['TrivialBidirectionalCursor', inputOutput | CursorAbility.Bidirectional, 
    () => new TrivialBidirectionalCursor(), 
    () => new TrivialBidirectionalCursor(), 
    () => new TrivialBidirectionalCursor(1)],
  ['TrivialRandomAccessCursor', inputOutput | CursorAbility.RandomAccess,
    () => new TrivialRandomAccessCursor(), 
    () => new TrivialRandomAccessCursor(), 
    () => new TrivialRandomAccessCursor(1)],
  ['TrivialContiguousCursor', inputOutput | CursorAbility.Contiguous,
    () => new TrivialContiguousCursor(), 
    () => new TrivialContiguousCursor(), 
    () => new TrivialContiguousCursor(1)],

  ['List', inputOutput | CursorAbility.Forward,
    () => list0.begin(), () => list0.end(), () => list1.begin()],
  ['Chain', inputOutput | CursorAbility.Bidirectional,
    () => chain0.beforeBegin(), () => chain0.end(), () => chain1.begin()],
  ['Vector', inputOutput | CursorAbility.RandomAccess,
    () => vector0.begin(), () => vector0.end(), () => vector1.begin()],
  ['Deque', inputOutput | CursorAbility.RandomAccess,
    () => deque0.begin(), () => deque0.end(), () => deque1.begin()],
  ['NodeBuffer', inputOutput | CursorAbility.Contiguous,
    () => nodeBuffer0.begin(), () => nodeBuffer0.end(), () => nodeBuffer1.begin()],
  ['EcmaBuffer', inputOutput | CursorAbility.Contiguous,
    () => ecmaBuffer0.begin(), () => ecmaBuffer0.end(), () => ecmaBuffer1.begin()],
]

describe.each(cases)('A %s', (name, abilities, begin0, end0, begin1) => {
  let begin
  let end
  beforeEach(() => {
    begin = begin0()
    end = end0()
  })
  it('should be a cursor', () => {
    expect(begin).toBeInstanceOf(Cursor)
  })
  it('should have abilities', () => {
    expect(begin.abilities).toBe(abilities)
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
  it('should throw if compared to null', () => {
    expect(() => begin.equals(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })

  // operations that throw if cursor does not support them
  it('should have undefined value', () => {
    if (expectNotAnInputCursor(begin, () => begin.value)) return
    expect(begin.value).toBeUndefined()
  })
  it('should throw on next', () => { 
    if (expectNotAnInputCursor(end, () => end.value)) return
    expect(() => end.next()).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
  it('should throw RangeError if set', () => {
    if (expectNotAnOutputCursor(begin, () => begin.value = 42)) return
    expect(() => begin.value = 42).toThrow(RangeError)
  })
  it('should be equal to its clone', () => {
    if (expectNotAForwardCursor(begin, () => begin.clone())) return
    const clone = begin.clone()
    expect(begin.equals(clone)).toBe(true)
  })
  it('should throw on stepBack', () => {
    if (expectNotABidirectionalCursor(begin, () => begin.stepBack())) return
    expect(() => begin.stepBack()).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
  it('should throw if moving forward', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.move(1))) return
    expect(() => begin.move(1)).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
  it('should throw if moving backward', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.move(-1))) return
    expect(() => begin.move(-1)).toThrow(
      "Cannot move cursor out of bounds."
    )
  })
  it('should return true if moving 0', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.move(0))) return
    expect(begin.move(0)).toBe(true)
  })
  it('should return undefined on at', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.at(0))) return
    expect(begin.at(0)).toBeUndefined()
  })
  it('should throw if set at offset', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.setAt(0, 42))) return
    expect(() => begin.setAt(0, 42)).toThrow(RangeError)
  })
  it('should return 0 on subtract', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.subtract(begin))) return
    expect(begin.subtract(begin)).toBe(0)
  })
  it('should throw if subtracting null', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.subtract(null))) return
    expect(() => begin.subtract(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })
  it('should return 0 on compareTo', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.compareTo(begin))) return
    expect(begin.compareTo(begin)).toBe(0)
  })
  it('should throw if compared to null', () => {
    if (expectNotARandomAccessCursor(begin, () => begin.compareTo(null))) return
    expect(() => begin.compareTo(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })
  it('should throw RangeError on read 1', () => {
    if (expectNotAContiguousCursor(begin, () => begin.read())) return
    expect(() => begin.read(1)).toThrow(RangeError)
  })
  it('should throw RangeError on read 2', () => {
    if (expectNotAContiguousCursor(begin, () => begin.read(2))) return
    expect(() => begin.read(2)).toThrow(RangeError)
  })
  it('should throw RangeError on read 4', () => {
    if (expectNotAContiguousCursor(begin, () => begin.read(4))) return
    expect(() => begin.read(4)).toThrow(RangeError)
  })
  it('should throw on read 8', () => {
    if (expectNotAContiguousCursor(begin, () => begin.read(8))) return
    expect(() => begin.read(8)).toThrow(Error)
  })
  it('should throw for named reads (e.g. readUInt8)', () => {
    if (expectNotAContiguousCursor(begin, () => begin.readUInt8())) return
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
    if (expectNotAContiguousCursor(begin, () => begin.data())) return
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
    if (expectNotAContiguousCursor(begin, () => begin.data(null))) return
    expect(() => begin.data(null)).toThrow(
      "Cursor cannot be null or undefined."
    )
  })

  describe('and another cursor from a different container', () => {
    let otherCursor
    beforeEach(() => {
      otherCursor = begin1()
    })
    it('should not be equatable', () => {
      expect(begin.equatableTo(otherCursor)).toBe(false)
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
      if (expectNotARandomAccessCursor(begin, () => begin.compareTo(otherCursor))) return
      expect(begin.compareTo(otherCursor)).toBe(0)
    })
    it('should subtract to zero', () => {
      if (expectNotARandomAccessCursor(begin, () => begin.subtract(otherCursor))) return
      expect(begin.subtract(otherCursor)).toBe(0)
    })
    it('should return an empty buffer for data', () => {
      if (expectNotAContiguousCursor(begin, () => begin.data())) return
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
      it('should throw not equatable on equals', () => {
        expect(() => begin.equals(otherCursor)).toThrow(
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
      expect(begin.equatableTo(otherCursor)).toBe(false)
    })
    it('should throw testing equality', () => {
      expect(() => begin.equals(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw subtracting from other cursor', () => {
      if (expectNotARandomAccessCursor(begin, () => begin.subtract(otherCursor))) return
      expect(() => begin.subtract(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw comparing to other cursor', () => {
      if (expectNotARandomAccessCursor(begin, () => begin.compareTo(otherCursor))) return
      expect(() => begin.compareTo(otherCursor)).toThrow(
        "Cursor is not equatable to the other cursor."
      )
    })
    it('should throw data with other cursor', () => {
      if (expectNotAContiguousCursor(begin, () => begin.data(otherCursor))) return
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
    it('should not have output ability', () => {
      expect(begin.abilities & Cursor.Ability.Output).toBe(0)
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
      if (expectNotARandomAccessCursor(begin, () => begin.setAt(0, 42))) return
      expect(() => begin.setAt(0, 42)).toThrow(
        "Cursor is read-only."
      )
    })
  })
})

  