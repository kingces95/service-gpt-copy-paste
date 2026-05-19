import { Defines, Abstracts, Extends } from '@kingjs/partial-class'
import { Preconditions, ThisChecks } from '@kingjs/partial-proxy'
import { PartialClass } from '@kingjs/partial-class'
import { extend } from '@kingjs/partial-extend'
import { 
  copy, 
} from '@kingjs/cursor-algorithm'
import {
  repeat,
  single,
} from '@kingjs/cursor-adapter'
import { snapshot } from '@kingjs/cursor-view'
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
import { NotEmpty } from './checks.js'

export class ContainerPart extends PartialClass {
  static [Implements] = RangeConcept
  static [Abstracts] = {
    get isEmpty() { },
    insert(value, { at = this.end(), after }) { },
    erase({ at = this.end(), after }) { }
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
  static [ThisChecks] = {
    shift: NotEmpty,
  }
  static [Abstracts] = {
    unshift(value) { },
    shift() { },
  }
}

export class BackEditableContainerPart extends ContainerPart {
  static [ThisChecks] = {
    pop: NotEmpty,
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
  
  take(cursor) {
    const result = cursor.value
    this.eraseAt(cursor)
    return result 
  }

  static {
    extend(this, ContainerPart, {
      insert(value, { at = this.end(), after } = { }) {
        this.insertAt(value, at)
      },
      erase({ at = this.begin(), after } = { }) {
        return this.eraseAt(at)
      },
    })

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

export class BulkAssignableContainerPart extends ClearableContainerPart {
  static [Abstracts] = {
    resizeTo(count, value) { },
    assignRange(range) { },
  }

  static [Defines] = {
    growTo(count, value = 0) {
      return this.resizeTo(count, value)
    },

    truncateTo(count) {
      return this.resizeTo(count)
    },

    clear() {
      return this.resizeTo(0)
    },

    assignCount(count, value) {
      const range = repeat(value, count)
      return this.assignRange(range)
    },
  }

  sourceRange$(range) {
    const first = range.begin()
    if (first.range == this)
      return snapshot(range)

    return range
  }
}

export class BulkEditableContainerPart extends BulkAssignableContainerPart {
  static [Implements] = EditableContainerPart
  static [Abstracts] = {
    insertRange(cursor, range) { },
    eraseRange(first, last) { },
  }

  // attachments that depend on abstract operations
  static [Defines] = {

    insertAt(value, cursor = this.begin()) {
      const range = single(value)
      return this.insertRange(cursor, range)
    },

    eraseAt(cursor = this.begin()) {
      return this.eraseRange(cursor, cursor.clone().step())
    },

    appendRange(range) {
      return this.insertRange(this.end(), range)
    },

    prependRange(range) {
      return this.insertRange(this.begin(), range)
    },

    insertCount(cursor, count, value) {
      const range = repeat(value, count)
      return this.insertRange(cursor, range)
    },

    appendCount(count, value) {
      return this.insertCount(this.end(), count, value)
    },

    prependCount(count, value) {
      return this.insertCount(this.begin(), count, value)
    },

    eraseCount(cursor, count) {
      const last = cursor.clone()
      last.move(count)
      return this.eraseRange(cursor, last)
    },

    eraseFrom(cursor) {
      return this.eraseRange(cursor, this.end())
    },

    eraseUntil(cursor) {
      return this.eraseRange(this.begin(), cursor)
    },

    replaceRange(first, last, replacementRange) {
      replacementRange = this.sourceRange$(replacementRange)

      const cursor = this.eraseRange(first, last)
      return this.insertRange(cursor, replacementRange)
    },
  }

}

export class AfterBulkEditableContainerPart extends ContainerPart {
  static [Abstracts] = {
    beforeBegin() { },
    insertRangeAfter(cursor, range) { },
    eraseRangeAfter(first, last) { },
  }

  static [Defines] = {
    appendRange(range) {
      let cursor = this.beforeBegin()
      const end = this.end()

      while (!cursor.clone().step().equals(end))
        cursor.step()

      return this.insertRangeAfter(cursor, range)
    },

    prependRange(range) {
      return this.insertRangeAfter(this.beforeBegin(), range)
    },

    insertCountAfter(cursor, count, value) {
      const range = repeat(value, count)
      return this.insertRangeAfter(cursor, range)
    },

    appendCount(count, value) {
      let cursor = this.beforeBegin()
      const end = this.end()

      while (!cursor.clone().step().equals(end))
        cursor.step()

      return this.insertCountAfter(cursor, count, value)
    },

    prependCount(count, value) {
      return this.insertCountAfter(this.beforeBegin(), count, value)
    },

    eraseCountAfter(cursor, count) {
      const last = cursor.clone()
      for (let i = 0; i <= count; i++)
        last.step()

      return this.eraseRangeAfter(cursor, last)
    },

    eraseFromAfter(cursor) {
      return this.eraseRangeAfter(cursor, this.end())
    },

    eraseUntilAfter(cursor) {
      return this.eraseRangeAfter(this.beforeBegin(), cursor)
    },

    replaceRangeAfter(first, last, replacementRange) {
      replacementRange = this.sourceRange$(replacementRange)

      this.eraseRangeAfter(first, last)
      return this.insertRangeAfter(first, replacementRange)
    },
  }
}

export class GapEditableContainerPart extends BulkEditableContainerPart {
  static [Implements] = SizedContainerPart
  static [Abstracts] = {
    openGap$(cursor, count) { },
    closeGap$(first, last) { },
  }

  get defaultValue$() { return undefined }

  insertRange(cursor, range) {
    range = this.sourceRange$(range)

    const first = range.begin()
    const last = range.end()
    const count = first.distanceTo(last)

    this.openGap$(cursor, count)
    copy(cursor, range)

    return this
  }

  eraseRange(first, last) {
    const result = first.clone()
    this.closeGap$(first, last)
    return result
  }

  resizeTo(count, value = this.defaultValue$) {
    if (count < this.size) {
      const first = this.begin().move(count)
      this.closeGap$(first, this.end())
      return this
    }

    const cursor = this.end()
    const delta = count - this.size
    this.openGap$(cursor, delta)
    copy(cursor, repeat(value, delta))
    return this
  }

  assignRange(range) {
    range = this.sourceRange$(range)

    this.clear()
    return this.insertRange(this.begin(), range)
  }
}
