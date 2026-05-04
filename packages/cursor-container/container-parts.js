import { Defines, Abstracts, Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/partial-proxy'
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
    get isEmpty() { },
    insert(value, { at = this.begin(), after }) { },
    erase({ at = this.begin(), after }) { }
  }
  
  get cursorType() { return this.constructor.cursorType }
}

export class SpliceableContainerPart extends ContainerPart {
  static [Preconditions] = {
    splice(cursor, outCount = 0, ...values) {
      if (cursor == null) throwNull()
      if (cursor.range != this) throwNotEquatableTo()
      if (outCount < 0) throw new RangeError(
        `outCount must be non-negative.`)
    }
  }
  
  splice(cursor, outCount = 1, ...values) { }
}

export class SizedContainerPart extends ContainerPart {
  static [Abstracts] = {
    get size() { }
  }

  get isEmpty() { return this.size == 0 }
}

export class ClearableContainerPart extends ContainerPart {
  static [Abstracts] = {
    clear() { }
  }
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
    insertAt(value, cursor) { },
    eraseAt(cursor) { },
  }
  
  insert(value, { at = this.end() } = { }) {
    this.insertAt(value, at)
  }
  take(cursor) {
    const result = cursor.value
    this.eraseAt(cursor)
    return result 
  }
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

export class AssociativeContainerPart extends ContainerPart {
  static [Abstracts] = {
    has(key) { },
    remove(key) { }
  }
}

export class UnorderedSetContainerPart extends AssociativeContainerPart {
  static [Abstracts] = {
    add(key) { }
  }
}

export class UnorderedMapContainerPart extends AssociativeContainerPart {
  static [Abstracts] = {
    get(key) { },
    add(key, value) { },
  }
}

