import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import { Cursor } from './cursor.js'
import { CursorFactory } from './cursor-factory.js'
import { Interval } from './interval.js'
import { Range } from './range.js'
import {
  ContainerConcept,
  InputContainerConcept,
  OutputContainerConcept,
  ForwardContainerConcept,
  BidirectionalContainerConcept,
  RandomAccessContainerConcept,
  ContiguousContainerConcept,
  PrologContainerConcept,
} from '@kingjs/cursor-container'
import { 
  List,
  Chain,
  Vector,
  Deque,
  NodeBuffer,
  EcmaBuffer 
} from '@kingjs/cursor-container'
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
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from './throw.js'


class TrivialCursor extends Cursor {
  static { implement(this, CursorConcept) }
  
  get __isActive$() { return true }
  step() { throwMoveOutOfBounds() }
  equals$(other) { return true }
}
class TrivialCursorFactory extends CursorFactory {
  static { implement(this, ContainerConcept) }
  static get cursorType() { return TrivialCursor }
}

class TrivialInputCursor extends TrivialCursor {
  static [Preconditions] = class extends TrivialCursor[Preconditions] {
    get value() { throwReadOutOfBounds() }
  }

  static { implement(this, InputCursorConcept) }
  get value() { return undefined }
}
class TrivialInputCursorFactory extends CursorFactory {
  static { implement(this, InputContainerConcept) }
  static get cursorType() { return TrivialInputCursor }
}

class TrivialOutputCursor extends TrivialCursor {
  static [Preconditions] = class extends TrivialCursor[Preconditions] {
    set value(value) { throwWriteOutOfBounds() }
  }

  static { implement(this, OutputCursorConcept) }
  set value(value) { throw new RangeError() }
}
class TrivialOutputCursorFactory extends CursorFactory {
  static { implement(this, OutputContainerConcept) }
  static get cursorType() { return TrivialOutputCursor }
}

class TrivialMutableCursor extends TrivialCursor {
  static [Preconditions] = class extends TrivialCursor[Preconditions] {
    get value() { throwReadOutOfBounds() }
    set value(value) { throwWriteOutOfBounds() }
  }

  get value() { throw new RangeError() }
  set value(value) { throw new RangeError() }
}
class TrivialMutableCursorFactory extends CursorFactory {
  static { 
    implement(this, InputContainerConcept)
    implement(this, OutputContainerConcept)
  }
  static get cursorType() { return TrivialMutableCursor }
}

class TrivialForwardCursor extends TrivialMutableCursor {
  static { implement(this, ForwardCursorConcept) }
  clone() { return new this.constructor() }
}
class TrivialForwardCursorFactory extends CursorFactory {
  static { implement(this, ForwardContainerConcept) }
  static get cursorType() { return TrivialForwardCursor }
}

class TrivialBidirectionalCursor extends TrivialForwardCursor {
  static { implement(this, BidirectionalCursorConcept) }
  stepBack() { throwMoveOutOfBounds() }
}
class TrivialBidirectionalCursorFactory extends CursorFactory {
  static { implement(this, BidirectionalContainerConcept) }
  static get cursorType() { return TrivialBidirectionalCursor }
}

class TrivialRandomAccessCursor extends TrivialBidirectionalCursor {
  static [Preconditions] = class extends TrivialBidirectionalCursor[Preconditions] {
    static { implement(this, RandomAccessCursorConcept[Preconditions]) }
    setAt(offset, value) { throwWriteOutOfBounds() }
    at(offset) { throwReadOutOfBounds() }
  }
  static { implement(this, RandomAccessCursorConcept) }

  move(offset) { 
    if (offset === 0) return this
    throwMoveOutOfBounds()
  }
  at(offset) { return undefined }
  setAt(offset, value) { throw new RangeError() }
  subtract(other) { return 0 }
  compareTo(other) { return 0 }
}
class TrivialRandomAccessCursorFactory extends CursorFactory {
  static { implement(this, RandomAccessContainerConcept) }
  static get cursorType() { return TrivialRandomAccessCursor }
}

class TrivialContiguousCursor extends TrivialRandomAccessCursor {
  static [Preconditions] = class extends TrivialRandomAccessCursor[Preconditions] {
    static { implement(this, ContiguousCursorConcept[Preconditions]) }
  }
  static { implement(this, ContiguousCursorConcept) }

  readAt(offset, length = 1, signed = false, littleEndian = false) {
    throw new RangeError()
  }
  data(other) { return Buffer.alloc(0) }
}
class TrivialContiguousCursorFactory extends CursorFactory {
  static { implement(this, ContiguousContainerConcept) }
  static get cursorType() { return TrivialContiguousCursor }
}

const intervals = [
  TrivialCursorFactory,
  TrivialInputCursorFactory,
  TrivialOutputCursorFactory,
  TrivialMutableCursorFactory,
  TrivialForwardCursorFactory,
  TrivialBidirectionalCursorFactory,
  TrivialRandomAccessCursorFactory,
  TrivialContiguousCursorFactory,
  List,
  Chain,
  Vector,
  Deque,
  NodeBuffer,
  EcmaBuffer,
]

describe.each(intervals.map(type => [
  type.name, type
]))('%s', (_, type) => {
  let interval
  let range
  let end
  let begin
  let cursorType
  beforeEach(() => {
    cursorType = type.cursorType
    interval = new type()
    range = interval.toRange()
    end = range.end
    begin = range.begin
  })
  it('should be an interval', () => {
    expect(interval).toBeInstanceOf(Interval)
  })
  it('should have a Range', () => {
    expect(range).toBeInstanceOf(Range)
  })
  it('should have expected begin and end cursor types', () => {
    expect(begin).toBeInstanceOf(cursorType)
    expect(end).toBeInstanceOf(cursorType)
  })
  it('should have equal begin an end cursors', () => {
    expect(end.equals(begin)).toBe(true)
  })
  describe.each([
    type.prototype instanceof ContainerConcept
  ].filter(Boolean))('as a container', (isContainer) => {
    let container
    beforeEach(() => {
      container = interval
    })
    it('should be empty', () => {
      expect(container.isEmpty).toBe(true)
    })
    it('should have matching begin to the range', () => {
      expect(container.begin()).toEqual(range.begin)
    })
    it('should have matching end to the range', () => {
      expect(container.end()).toEqual(range.end)
    })
  })
  describe('end cursor', () => {
    it('should be equal to itself', () => {
      expect(end.equals(end)).toBe(true)
    })
    it('should not be equal to null', () => {
      expect(end.equals(null)).toBe(false)
    })
    it('should be equatable to itself', () => {
      expect(end.equatableTo(end)).toBe(true)
    })
    it('should not be equatable to null', () => {
      expect(end.equatableTo(null)).toBe(false)
    })
    it('should not be equatable to empty string', () => {
      expect(end.equatableTo('')).toBe(false)
    })
    it('should equal the begin cursor', () => {
      expect(end.equals(begin)).toBe(true)
    })
    it('should throw on step', () => {
      expect(() => end.step()).toThrow(
        "Cannot move cursor out of bounds.")
    })
    describe.each([
      type.prototype instanceof InputContainerConcept
    ].filter(Boolean))('from an input container', (isInput) => {
      it('should be an input cursor', () => {
        expect(end).toBeInstanceOf(InputCursorConcept)
      })
      it('should throw on read', () => {
        expect(() => end.value).toThrow(
          "Cannot read value out of bounds of cursor.")
      })
    })
    describe.each([
      type.prototype instanceof OutputContainerConcept
    ].filter(Boolean))('from an output container', (isOutput) => {
      it('should be an output cursor', () => {
        expect(end).toBeInstanceOf(OutputCursorConcept)
      })
      it('should throw on write', () => {
        expect(() => end.value = 1).toThrow(
          "Cannot write value out of bounds of cursor.")
      })
    })
    describe.each([
      type.prototype instanceof ForwardContainerConcept
    ].filter(Boolean))('from a forward container', (isForward) => {
      it('should be a forward cursor', () => {
        expect(end).toBeInstanceOf(ForwardCursorConcept)
      })
      it('should be clonable and equal to itself', () => {
        expect(end.clone()).toEqual(end)
      })
    })
    describe.each([
      type.prototype instanceof BidirectionalContainerConcept
    ].filter(Boolean))('from a rewind container', (isRewind) => {
      it('should be a rewind cursor', () => {
        expect(end).toBeInstanceOf(BidirectionalCursorConcept)
      })
      describe.each([
        type.prototype instanceof PrologContainerConcept
      ].filter(Boolean))('and a prolog container', (isProlog) => {
        let prologContainer
        let beforeBegin
        beforeEach(() => {
          prologContainer = interval
          beforeBegin = prologContainer.beforeBegin()
        })
        it('should step back to before begin', () => {
          expect(beforeBegin.equals(end.stepBack())).toBe(true)
        })
        it('should equal before begin stepped forward', () => {
          expect(beforeBegin.step().equals(end)).toBe(true)
        })
        it('should throw if step back twice', () => {
          expect(end.stepBack()).toEqual(end)
          expect(() => end.stepBack()).toThrow(
            "Cannot move cursor out of bounds.")
        })
      })
      describe.each([
        !(type.prototype instanceof PrologContainerConcept)
      ].filter(Boolean))('and not a prolog container', (isProlog) => {
        it('should throw on step back', () => {
          expect(() => end.stepBack()).toThrow(
            "Cannot move cursor out of bounds.")
        })
      })
    })
    describe.each([
      type.prototype instanceof RandomAccessContainerConcept
    ].filter(Boolean))('from a random access container', (isRandomAccess) => {
      it('should be a random access cursor', () => {
        expect(end).toBeInstanceOf(RandomAccessCursorConcept)
      })
      it('should throw on move', () => {
        expect(() => end.move(1)).toThrow(
          "Cannot move cursor out of bounds.")
      })
      it('should throw on move back', () => {
        expect(() => end.move(-1)).toThrow(
          "Cannot move cursor out of bounds.")
      })
      it('should throw on at', () => {
        expect(() => end.at(0)).toThrow(
          "Cannot read value out of bounds of cursor.")
      })
      it('should throw on setAt', () => {
        expect(() => end.setAt(0, 1)).toThrow(
          "Cannot write value out of bounds of cursor.")
      })
      it('should return 0 on subtract', () => {
        expect(end.subtract(end)).toBe(0)
      })
      it('should throw if subtracting null', () => {
        expect(() => end.subtract(null)).toThrow(
          "Cursor is not an equatable cursor in this context.")
      })
      it('should return 0 on compareTo', () => {
        expect(end.compareTo(end)).toBe(0)
      })
      it('should throw if comparing to null', () => {
        expect(() => end.compareTo('')).toThrow(
          "Cursor is not an equatable cursor in this context.")
      })
    })
    describe.each([
      type.prototype instanceof ContiguousContainerConcept
    ].filter(Boolean))('from a contiguous container', (isContiguous) => {
      it('should be a contiguous cursor', () => {
        expect(end).toBeInstanceOf(ContiguousCursorConcept)
      })
      // it('should throw on read 1', () => {
      //   expect(() => end.read(1)).toThrow(
      //     "Cannot read value out of bounds of cursor.")
      // })
    })
  })
})

  