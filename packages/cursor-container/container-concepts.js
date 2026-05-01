import { Defines, Abstracts, Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/partial-proxy'
import { Concept } from '@kingjs/partial-concept'
import { PartialClass } from '@kingjs/partial-class'
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
import { Implements } from '@kingjs/partial-concept'

export class ContainerPart extends PartialClass {
  static [Implements] = RangeConcept
  static [Abstracts] = {
    get isEmpty() { }
  }
  
  get cursorType() { return this.constructor.cursorType }
  get isEmpty() { 
    return this.begin({ fixed: true })
      .equals(this.end({ fixed: true }))
  }
}

export class InputContainerPart
  extends ContainerPart {
  static cursorType = InputCursorConcept
  static [Implements] = InputRangeConcept
}
export class OutputContainerPart 
  extends ContainerPart {
  static cursorType = OutputCursorConcept
  static [Implements] = OutputRangeConcept
}
export class ForwardContainerPart 
  extends InputContainerPart {
  static cursorType = ForwardCursorConcept
  static [Implements] = ForwardRangeConcept
}
export class BidirectionalContainerPart 
  extends ForwardContainerPart {
  static cursorType = BidirectionalCursorConcept
  static [Implements] = BidirectionalRangeConcept
}
export class RandomAccessContainerPart 
  extends BidirectionalContainerPart {
  static cursorType = RandomAccessCursorConcept
  static [Implements] = RandomAccessRangeConcept
}
export class ContiguousContainerPart 
  extends RandomAccessContainerPart {
  static cursorType = ContiguousCursorConcept
  static [Implements] = ContiguousRangeConcept
}

export class SpliceableContainerPart extends ContainerPart {
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

export class FrontEditableContainerPart extends ContainerPart { 
  static [Preconditions] = {
    shift() { if (this.isEmpty) throwEmpty() },
    get front() { if (this.isEmpty) throwEmpty() }
  }
  static [Abstracts] = {
    get front() { },
    unshift(value) { },
    shift() { },
  }
}

export class BackEditableContainerPart extends ContainerPart {
  static [Preconditions] = {
    pop() { if (this.isEmpty) throwEmpty() },
    get back() { if (this.isEmpty) throwEmpty() },
  }
  static [Abstracts] = {
    get back() { },
    pop() { },
    push(value) { },
  }
}

export class EditableContainerPart extends ContainerPart {
  static [Extends] = [
    FrontEditableContainerPart,
    BackEditableContainerPart,
  ]
  static [Abstracts] = {
    insert(cursor, value) { },
    erase(cursor) { },
  }

  take(cursor) {
    const result = cursor.value
    this.erase(cursor)
    return result 
  }
}

export class ClearableContainerPart extends ContainerPart {
  static [Abstracts] = {
    clear() { }
  }
}

export class SizedContainerPart extends ContainerPart {
  static [Abstracts] = {
    get count() { }
  }

  get isEmpty() { return this.count == 0 }
}

export class IndexableContainerPart extends SizedContainerPart {
  static [Abstracts] = {
    at(index) { },
    setAt(index, value) { }
  }

  copy(cursor, begin, end) {
    const source = begin.clone()
    const target = cursor.clone()
    while(!begin.equals(end)) {
      target.value = source.value
      source.step()
      target.step()
    }
  }
}

export class ByteContainerPart extends IndexableContainerPart {
  static [Abstracts] = {
    readAt(cursor, offset, length, signed, littleEndian) { },
    writeAt(cursor, offset, value, length, signed, littleEndian) { },
    data(index, other) { },
  }
}

export class CapacityContainerPart extends ContainerPart {
  static [Abstracts] = {
    get capacity() { }
  }
}

export class ReservableContainerPart extends CapacityContainerPart {
  static [Abstracts] = {
    setCapacity(count) { }
  }

  ensureCapacity(count) {
    if (count <= this.capacity) return this.capacity
    const newCapacity = Math.max(count, this.capacity * 2)
    this.setCapacity(newCapacity)
    return newCapacity
  }
}
