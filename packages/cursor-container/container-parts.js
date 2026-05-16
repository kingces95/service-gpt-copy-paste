import { Defines, Abstracts, Extends } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/partial-proxy'
import { PartialClass } from '@kingjs/partial-class'
import { extend } from '@kingjs/partial-extend'
import { 
  copy, 
  copyBackward, 
} from '@kingjs/cursor-algorithm'
import {
  repeat,
  single,
} from '@kingjs/cursor-adapter'
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
  throwWriteOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { Implements } from '@kingjs/partial-concept'

export class ContainerPart extends PartialClass {
  static [Implements] = RangeConcept
  static [Abstracts] = {
    get isEmpty() { },
    insert(value, { at = this.begin(), after }) { },
    erase({ at = this.begin(), after }) { }
  }

  throwIfNull$(value) { 
    if (value == null) throwNull() 
  }
  throwIfEmpty$() { 
    if (this.isEmpty) throwEmpty() 
  }
  throwIfForeignCursor$(other) { 
    this.throwIfNull$(other)
    if (other.range != this) throwNotEquatableTo()
  }
  throwIfEnd$(cursor) {
    if (cursor.equals(this.end())) throwUpdateOutOfBounds()
  }  

  get cursorType() { return this.constructor.cursorType }
}

export class SpliceableContainerPart extends ContainerPart {
  static [Preconditions] = {
    splice(cursor, outCount = 0, ...values) {
      this.throwIfForeignCursor$(cursor)
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
    shift() { this.throwIfEmpty$() },
  }
  static [Abstracts] = {
    unshift(value) { },
    shift() { },
  }
}

export class BackEditableContainerPart extends ContainerPart {
  static [Preconditions] = {
    pop() { this.throwIfEmpty$() },
  }
  static [Abstracts] = {
    pop() { },
    push(value) { },
  }
}

export class EditableContainerPart extends ContainerPart {
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

  static {
    extend(this, FrontEditableContainerPart, {
      unshift(value) { this.insertAt(value, this.begin()) },
      shift() { 
        const begin = this.begin()
        const result = begin.value
        this.eraseAt(begin)
        return result
      },
    })

    extend(this, BackEditableContainerPart, {
      push(value) { this.insertAt(value, this.end()) },
      pop() { 
        const end = this.end()
        end.stepBack()
        const value = end.value
        this.eraseAt(end)
        return value
      }
    })    
  }
}

export class IndexableContainerPart extends SizedContainerPart {  
  static [Preconditions] = {
    at(index) {
      if (index < 0) throwReadOutOfBounds()
      if (index >= this.size) throwReadOutOfBounds()
    },
    setAt(index, value) {
      if (index < 0) throwWriteOutOfBounds()
      if (index >= this.size) throwWriteOutOfBounds()
    },
  }
  
  static [Abstracts] = {
    at(index) { },
    setAt(index, value) { }
  }
}

export class ByteContainerPart extends IndexableContainerPart {
  static [Abstracts] = {
    span(range) { },
  }

  get spanType() { return this.constructor.spanType }
}

export class CapacityContainerPart extends ContainerPart {
  static [Abstracts] = {
    get capacity() { }
  }
}

export class ReservableContainerPart extends CapacityContainerPart {
  static [Preconditions] = {
    setCapacity(count) {
      if (count < 0) throw new RangeError(
        `capacity must be non-negative.`)
      if (count < this.capacity) throw new RangeError(
        `Cannot shrink capacity from ${this.capacity} to ${count}.`)
    }
  }

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

export class BulkEditableContainerPart extends EditableContainerPart {
  static [Implements] = ClearableContainerPart
  static [Abstracts] = {
    insertRange(cursor, first, last) { },
    eraseRange(first, last) { },
    resizeTo(count, value) { },
    assignRange(first, last) { },
  }

  // attachments that depend on abstract operations
  static [Defines] = {

    insertAt(value, cursor = this.begin()) {
      const range = single(value)
      return this.insertRange(cursor, range.begin(), range.end())
    },

    eraseAt(cursor = this.begin()) {
      return this.eraseRange(cursor, cursor.clone().step())
    },

    appendRange(first, last) {
      return this.insertRange(this.end(), first, last)
    },

    prependRange(first, last) {
      return this.insertRange(this.begin(), first, last)
    },

    insertCount(cursor, count, value) {
      const range = repeat(value, count)
      return this.insertRange(cursor, range.begin(), range.end())
    },

    appendCount(count, value) {
      return this.insertCount(this.end(), count, value)
    },

    prependCount(count, value) {
      return this.insertCount(this.begin(), count, value)
    },

    eraseCount(cursor, count) {
      const last = cursor.clone()
      last.advance(count)
      return this.eraseRange(cursor, last)
    },

    eraseFrom(cursor) {
      return this.eraseRange(cursor, this.end())
    },

    eraseUntil(cursor) {
      return this.eraseRange(this.begin(), cursor)
    },

    clear() {
      return this.eraseRange(this.begin(), this.end())
    },

    growTo(count, value = 0) {
      return this.resizeTo(count, value)
    },

    truncateTo(count) {
      return this.resizeTo(count)
    },

    replaceRange(first, last, replacementFirst, replacementLast) {
      const cursor = this.eraseRange(first, last)
      return this.insertRange(cursor, replacementFirst, replacementLast)
    },

    assignCount(count, value) {
      const range = new FillRange(value, count)
      return this.assignRange(range.begin(), range.end())
    },
  }

  insertRange(cursor, first, last) {
    const count = first.distanceTo(last)

    copyBackward(
      this.end(),
      cursor.clone().advance(count),
      cursor,
    )

    copy(cursor, first, last)

    return this
  }

  eraseRange(first, last) {
    copy(first, last, this.end())
    return first
  }

  resizeTo(count, value = 0) {
    fill(this.end(), count - this.size, value)
    return this
  }

  assignRange(first, last) {
    copy(this.begin(), first, last)
    return this
  }
}
