import { Defines, Abstracts, Extends } from '@kingjs/partial-class'
import { ArgChecks, Defaults, Preconditions } from '@kingjs/partial-proxy'
import { PartialClass } from '@kingjs/partial-class'
import { extend } from '@kingjs/partial-extend'
import { implement } from '@kingjs/partial-implement'
import { 
  copy, 
  next,
} from '@kingjs/cursor-algorithm'
import {
  repeat,
  single,
} from '@kingjs/cursor-adapter'
import { defaultTo } from '@kingjs/function-contract'
import { snapshot } from '@kingjs/cursor-view'
import {
  CloneableCursorConcept,
  CursorConcept,
  RangeConcept,

  throwNull,
  throwEmpty,
  throwNotEquatableTo,
  throwUpdateOutOfBounds,
  throwWriteOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { Implements } from '@kingjs/partial-concept'
import { NormalNumber } from './checks.js'

export class ContainerPart extends PartialClass {
  static {
    implement(this, RangeConcept)
  }

  static [Abstracts] = {
    get isEmpty() { },
  }
  static [Defines] = {
    notNullAssert$(value) {
      if (value == null) throwNull()
    },
    nonEmptyAssert$() {
      if (this.isEmpty) throwEmpty()
    },
    ownCursorAssert$(cursor) {
      this.notNullAssert$(cursor)
      if (cursor.range != this) throwNotEquatableTo()
    },
    notEndAssert$(cursor) {
      if (cursor.equals(this.end())) throwUpdateOutOfBounds()
    },
    firstThenLastAssert$(first, last) {
      if (first.compareTo) {
        if (first.compareTo(last) > 0)
          throwUpdateOutOfBounds()
        return
      }

      for (const cursor = first.clone(); !cursor.equals(last); cursor.step())
        this.notEndAssert$(cursor)
    },
    ownCursorPairAssert$(first, last) {
      this.ownCursorAssert$(first)
      this.ownCursorAssert$(last)
      this.firstThenLastAssert$(first, last)
    }
  }

  sourceRange$(range) {
    const first = range.begin()
    if (first.range == this)
      return snapshot(range)

    return range
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

export class FrontInsertableContainerPart extends ContainerPart {
  static [Preconditions] = {
    popFront() {
      this.nonEmptyAssert$()
    },
  }

  static [Abstracts] = {
    pushFront(value) { },
    popFront() { },
  }
}

export class BackInsertableContainerPart extends ContainerPart {
  static [Preconditions] = {
    popBack() {
      this.nonEmptyAssert$()
    },
  }

  static [Abstracts] = {
    popBack() { },
    pushBack(value) { },
  }
}

export class EditableContainerPart extends ContainerPart {
  static [ArgChecks] = {
    insertValue: [CursorConcept, null],
    erase: [CursorConcept, CursorConcept],
  }

  static [Defaults] = {
    erase: [
      undefined,
      defaultTo(({ args: [first] }) => next(first)),
    ],
  }

  static [Preconditions] = {
    insertValue(cursor, value) {
      this.ownCursorAssert$(cursor)
    },

    erase(first, last) {
      this.ownCursorPairAssert$(first, last)
    },
  }

  static [Abstracts] = {
    insertValue(cursor, value) { },
    erase(first, last = next(first)) { },
  }
  
  static {
    extend(this, FrontInsertableContainerPart, {
      pushFront(value) { this.insertValue(this.begin(), value) },
      popFront() {
        const begin = this.begin()
        const result = begin.value
        this.erase(begin)
        return result
      },
    })

    extend(this, BackInsertableContainerPart, {
      pushBack(value) { this.insertValue(this.end(), value) },
      popBack() {
        const end = this.end()
        end.stepBack()
        const value = end.value
        this.erase(end)
        return value
      }
    })    
  }
}

export class PhasedContainerPart extends ContainerPart {
  static [ArgChecks] = {
    insertValueAfter: [CursorConcept, null],
    eraseAfter: [CloneableCursorConcept, CursorConcept],
  }

  static [Defaults] = {
    eraseAfter: [
      undefined,
      defaultTo(({ args: [first] }) => next(first, 2)),
    ],
  }

  static [Defines] = {
    ownButNotEndCursorAssert$(cursor) {
      this.ownCursorAssert$(cursor)
      this.notEndAssert$(cursor)
    },
  }

  static [Preconditions] = {
    insertValueAfter(cursor, value) {
      this.ownButNotEndCursorAssert$(cursor)
    },

    eraseAfter(first, last) {
      this.ownButNotEndCursorAssert$(first)
      this.ownCursorPairAssert$(next(first), last)
    },
  }

  static [Abstracts] = {
    beforeBegin() { },
    insertValueAfter(cursor, value) { },
    eraseAfter(first, last = next(first, 2)) { },
  }
}

export class IndexableContainerPart extends SizedContainerPart {
  static [ArgChecks] = {
    at: [NormalNumber],
    setAt: [NormalNumber],
  }

  static [Defines] = {
    lessThanSizeAssert$(index, throwOutOfBounds) {
      if (index >= this.size) throwOutOfBounds()
    },
  }

  static [Preconditions] = {
    at(index) {
      this.lessThanSizeAssert$(index, throwReadOutOfBounds)
    },
    setAt(index, value) {
      this.lessThanSizeAssert$(index, throwWriteOutOfBounds)
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
  static [ArgChecks] = {
    reserve: [NormalNumber],
  }

  static [Abstracts] = {
    setCapacity$(count) { }
  }

  reserve(count) {
    if (count <= this.capacity) return this.capacity
    const newCapacity = Math.max(count, this.capacity * 2)
    this.setCapacity$(newCapacity)
    return newCapacity
  }
}

export class AssociativeContainerPart extends ContainerPart {
  static [Abstracts] = {
    contains(key) { },
    erase(key) { }
  }
}

export class SetAssociativeContainerPart extends AssociativeContainerPart {
  static [Abstracts] = {
    insert(key) { }
  }
}

export class MapAssociativeContainerPart extends AssociativeContainerPart {
  static [Abstracts] = {
    at(key) { },
    insertOrAssign(key, value) { },
  }
}

export class BulkAssignableContainerPart extends ClearableContainerPart {
  static [ArgChecks] = {
    resize: [NormalNumber, null],
    assignRange: [RangeConcept],
    assign: [NormalNumber],
  }

  static [Defaults] = {
    resize: [
      undefined,
      defaultTo(({ self }) => self.defaultValue$),
    ],
  }

  get defaultValue$() { return undefined }

  static [Abstracts] = {
    resize(count, value = this.defaultValue$) { },
    assignRange(range) { },
  }

  static [Defines] = {
    clear() {
      return this.resize(0)
    },

    assign(count, value) {
      const range = repeat(value, count)
      return this.assignRange(range)
    },
  }
}

export class BulkEditableContainerPart extends EditableContainerPart {
  static [ArgChecks] = {
    insertRange: [CursorConcept, RangeConcept],
    insert: [CursorConcept, NormalNumber],
    replaceRange: [CursorConcept, CursorConcept, RangeConcept],
  }

  static [Preconditions] = {
    insertRange(cursor, range) {
      this.ownCursorAssert$(cursor)
    },

    insert(cursor, count, value) {
      this.ownCursorAssert$(cursor)
    },

    replaceRange(first, last, replacementRange) {
      this.ownCursorPairAssert$(first, last)
    },
  }

  static [Abstracts] = {
    insertRange(cursor, range) { },
  }

  static [Defaults] = {
    insertValue: [
      defaultTo(({ self }) => self.begin()),
    ],
  }

  // attachments that depend on abstract operations
  static [Defines] = {

    insertValue(cursor = this.begin(), value) {
      const range = single(value)
      return this.insertRange(cursor, range)
    },

    insert(cursor, count, value) {
      const range = repeat(value, count)
      return this.insertRange(cursor, range)
    },

    replaceRange(first, last, replacementRange) {
      replacementRange = this.sourceRange$(replacementRange)

      const cursor = this.erase(first, last)
      return this.insertRange(cursor, replacementRange)
    },
  }

}

export class PhasedBulkContainerPart extends PhasedContainerPart {
  static [ArgChecks] = {
    insertRangeAfter: [CursorConcept, RangeConcept],
    insertAfter: [CursorConcept, NormalNumber],
    replaceRangeAfter: [CursorConcept, CursorConcept, RangeConcept],
  }

  static [Preconditions] = {
    insertRangeAfter(cursor, range) {
      this.ownButNotEndCursorAssert$(cursor)
    },

    insertAfter(cursor, count, value) {
      this.ownButNotEndCursorAssert$(cursor)
    },

    replaceRangeAfter(first, last, replacementRange) {
      this.ownButNotEndCursorAssert$(first)
      this.ownCursorPairAssert$(next(first), last)
    },
  }

  static [Abstracts] = {
    insertRangeAfter(cursor, range) { },
  }

  static [Defines] = {
    insertAfter(cursor, count, value) {
      const range = repeat(value, count)
      return this.insertRangeAfter(cursor, range)
    },

    replaceRangeAfter(first, last, replacementRange) {
      replacementRange = this.sourceRange$(replacementRange)

      this.eraseAfter(first, last)
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

  insertRange(cursor, range) {
    range = this.sourceRange$(range)

    const first = range.begin()
    const last = range.end()
    const count = first.distanceTo(last)

    this.openGap$(cursor, count)
    copy(cursor, range)

    return this
  }

  erase(first, last = next(first)) {
    const result = first.clone()
    this.closeGap$(first, last)
    return result
  }
}

export class GapAssignableContainerPart extends GapEditableContainerPart {
  static [Extends] = [
    BulkAssignableContainerPart,
  ]

  resize(count, value = this.defaultValue$) {
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
