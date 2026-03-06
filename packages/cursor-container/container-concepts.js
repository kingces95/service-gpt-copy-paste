import { Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  RangeConcept,
  InputRangeConcept,
  OutputRangeConcept,
  ForwardRangeConcept,
  BidirectionalRangeConcept,
  RandomAccessRangeConcept,
  ContiguousRangeConcept,

  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,

  throwNull,
  throwEmpty,
  throwNotEquatableTo,
  throwUpdateOutOfBounds,
} from '@kingjs/cursor'
import { Implements } from '@kingjs/concept'

export class ContainerConcept extends RangeConcept {
  [Extends] = {
    get cursorType() { return this.constructor.cursorType },
    get isEmpty() { 
      return this.begin({ fixed: true })
        .equals(this.end({ fixed: true }))
    }
  }

  get isEmpty() { }
}

export class InputContainerConcept
  extends ContainerConcept {
  static cursorType = InputCursorConcept
  static [Implements] = InputRangeConcept
}
export class OutputContainerConcept 
  extends ContainerConcept {
  static cursorType = OutputCursorConcept
  static [Implements] = OutputRangeConcept
}
export class ForwardContainerConcept 
  extends InputContainerConcept {
  static cursorType = ForwardCursorConcept
  static [Implements] = ForwardRangeConcept
}
export class BidirectionalContainerConcept 
  extends ForwardContainerConcept {
  static cursorType = BidirectionalCursorConcept
  static [Implements] = BidirectionalRangeConcept
}
export class RandomAccessContainerConcept 
  extends BidirectionalContainerConcept {
  static cursorType = RandomAccessCursorConcept
  static [Implements] = RandomAccessRangeConcept
}
export class ContiguousContainerConcept 
  extends RandomAccessContainerConcept {
  static cursorType = ContiguousCursorConcept
  static [Implements] = ContiguousRangeConcept
}

export class SpliceableContainerConcept extends ContainerConcept {
  static [Preconditions] = {
    splice(cursor, outCount = 0, ...values) {
      if (cursor == null) throwNull()
      if (cursor.range != this) throwNotEquatableTo()
      if (outCount < 0) throw new RangeError(
        `outCount must be non-negative.`)
      const count = this.count
    }
  }
  
  splice(cursor, outCount = 1, ...values) { }
}

export class FrontEditableContainerConcept extends ContainerConcept { 
  static [Preconditions] = {
    shift() { if (this.isEmpty) throwEmpty() },
    get front() { if (this.isEmpty) throwEmpty() }
  }

  get front() { }
  unshift(value) { }
  shift() { }
}

export class BackEditableContainerConcept extends ContainerConcept {
  static [Preconditions] = {
    pop() { if (this.isEmpty) throwEmpty() },
    get back() { if (this.isEmpty) throwEmpty() },
  }
  
  get back() { }
  pop() { }
  push(value) { }
}

export class EditableContainerConcept extends ContainerConcept {
  static [Implements] = [
    FrontEditableContainerConcept,
    BackEditableContainerConcept,
  ]
  insert(cursor, value) { }
  remove(cursor) { }
}

export class CountableContainerConcept extends ContainerConcept {
  static [Extends] = {
    get isEmpty() { return this.count == 0 }
  }

  get count() { }
}

export class IndexableContainerConcept extends CountableContainerConcept {
  at(index) { }
  setAt(index, value) { }
}

export class ByteContainerConept extends IndexableContainerConcept {
  copy(cursor, begin, end) { }
  readAt(cursor, offset, length, signed, littleEndian) { }
  writeAt(cursor, offset, value, length, signed, littleEndian) { }
  data(index, other) { }
}

export class BufferContainerConcept extends ContainerConcept {
  static [Extends] = {
    ensureCapacity(count) {
      if (count <= this.capacity) return this.capacity
      const newCapacity = Math.max(count, this.capacity * 2)
      this.setCapacity(newCapacity)
      return newCapacity
    },
  }
  ensureCapacity(count) { } // TODO: Remove once loader fixed
  get capacity() { }
  setCapacity(count) { }
}


