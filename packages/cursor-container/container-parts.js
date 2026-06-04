import { Defines, DefinesAbstract, Composes } from '@kingjs/partial-class'
import {
  ArgChecks,
  ThisChecks,
} from '@kingjs/partial-proxy'
import { PartialClass } from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { members } from '@kingjs/partial-signature'
import { thunk } from '@kingjs/function-contract'
import { genericType } from '@kingjs/generic'
import {
  RandomAccessCursorShape,
} from '@kingjs/cursor-shape'
import {
  copy,
  next,
} from '@kingjs/cursor-algorithm'
import {
  repeat,
  single,
} from '@kingjs/cursor-adapter'
import { defaultTo } from '@kingjs/function-args'
import {
  NormalNumber,
  OptionalOf,
} from '@kingjs/simple-type'
import { snapshot } from '@kingjs/cursor-view'
import {
  CloneableCursorConcept,
  CursorConcept,
  RangeConcept,

  throwNotEquatableTo,
  throwUpdateOutOfBounds,
  throwWriteOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { NotEmpty } from './checks.js'

export function sourceRange(range) {
  const first = range.begin()
  if (first.range == this)
    return snapshot(range)

  return range
}

export class ContainerPart extends PartialClass {
  static {
    implement(this, RangeConcept, { }, {
      begin() { },
      end() { },
    })
  }

  static [DefinesAbstract] = {
    get isEmpty() { },
  }

  static [Defines] = {
    ownCursorAssert$(cursor) {
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
}

export class SizedContainerPart extends ContainerPart {
  static [DefinesAbstract] = {
    get size() { }
  }

  get isEmpty() { return this.size == 0 }
}

export class ClearableContainerPart extends ContainerPart {
  static [DefinesAbstract] = {
    clear() { }
  }
}

export const FrontInsertableContainerPartOf = genericType(
  TValue => class FrontInsertableContainerPart extends ContainerPart {
    static [ThisChecks] = {
      popFront: NotEmpty,
    }

    static [DefinesAbstract] = members(this, {
      pushFront: {
        types: [TValue],
        method(value) { },
      },

      popFront() { },
    })
  }
)

export const BackInsertableContainerPartOf = genericType(
  TValue => class BackInsertableContainerPart extends ContainerPart {
    static [ThisChecks] = {
      popBack: NotEmpty,
    }

    static [DefinesAbstract] = members(this, {
      pushBack: {
        types: [TValue],
        method(value) { },
      },

      popBack() { },
    })
  }
)

export const EditableContainerPartOf = genericType(TValue => {
  return class EditableContainerPart extends ContainerPart {
    static [DefinesAbstract] = members(this, {
      insertValue: {
        types: [CursorConcept, TValue],
        precondition(cursor, value) {
          this.ownCursorAssert$(cursor)
        },
        method(cursor, value) { },
      },

      erase: {
        types: [CursorConcept, CursorConcept],
        defaults: [
          undefined,
          defaultTo(({ args: [first] }) => next(first)),
        ],
        precondition(first, last) {
          this.ownCursorPairAssert$(first, last)
        },
        method(first, last /* = next(first) */) { },
      },
    })

    static {
      compose(this, FrontInsertableContainerPartOf(TValue), {
        pushFront(value) { this.insertValue(this.begin(), value) },
        popFront() {
          const begin = this.begin()
          const result = begin.value
          this.erase(begin)
          return result
        },
      })

      compose(this, BackInsertableContainerPartOf(TValue), {
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
})

export const PhasedContainerPartOf = genericType(
  TValue => class PhasedContainerPart extends ContainerPart {
    static [Defines] = {
      ownButNotEndCursorAssert$(cursor) {
        this.ownCursorAssert$(cursor)
        this.notEndAssert$(cursor)
      },
    }

    static [DefinesAbstract] = members(this, {
      beforeBegin() { },

      insertValueAfter: {
        types: [CursorConcept, TValue],
        precondition(cursor, value) {
          this.ownButNotEndCursorAssert$(cursor)
        },
        method(cursor, value) { },
      },

      eraseAfter: {
        types: [CloneableCursorConcept, CursorConcept],
        defaults: [
          undefined,
          defaultTo(({ args: [first] }) => next(first, 2)),
        ],
        precondition(first, last) {
          this.ownButNotEndCursorAssert$(first)
          this.ownCursorPairAssert$(next(first), last)
        },
        method(first, last /* = next(first, 2) */) { },
      },
    })
  }
)

export const IndexableContainerPartOf = genericType(
  TValue => class IndexableContainerPart extends SizedContainerPart {
    static [Defines] = {
      lessThanSizeAssert$(index, throwOutOfBounds) {
        if (index >= this.size) throwOutOfBounds()
      },
    }

    static [DefinesAbstract] = members(this, {
      at: {
        types: [NormalNumber],
        precondition(index) {
          this.lessThanSizeAssert$(index, throwReadOutOfBounds)
        },
        method(index) { },
      },

      setAt: {
        types: [NormalNumber, TValue],
        precondition(index, value) {
          this.lessThanSizeAssert$(index, throwWriteOutOfBounds)
        },
        method(index, value) { },
      },
    })
  }
)

export const ByteContainerPartOf = genericType(TValue => {
  return class ByteContainerPart extends IndexableContainerPartOf(TValue) {
    static [DefinesAbstract] = members(this, {
      span: {
        types: [CursorConcept, CursorConcept],
        defaults: [
          defaultTo(({ self }) => self.begin()),
          defaultTo(({ self }) => self.end()),
        ],
        method(begin /* = this.begin() */, end /* = this.end() */) { },
      },
    })

    get spanType() { return this.constructor.spanType }
  }
})

export class CapacityContainerPart extends ContainerPart {
  static [DefinesAbstract] = {
    get capacity() { }
  }
}

export class ReservableContainerPart extends CapacityContainerPart {
  static [ArgChecks] = {
    reserve: [NormalNumber],
  }

  static [DefinesAbstract] = {
    setCapacity$(count) { }
  }

  reserve(count) {
    if (count <= this.capacity) return this.capacity
    const newCapacity = Math.max(count, this.capacity * 2)
    this.setCapacity$(newCapacity)
    return newCapacity
  }
}

export const AssociativeContainerPartOf = genericType(
  TKey => class AssociativeContainerPart extends ContainerPart {
    static [DefinesAbstract] = members(this, {
      contains: {
        types: [TKey],
        method(key) { },
      },

      erase: {
        types: [TKey],
        method(key) { },
      },
    })
  }
)

export const SetAssociativeContainerPartOf = genericType(TKey => {
  return class SetAssociativeContainerPart
    extends AssociativeContainerPartOf(TKey) {
    static [DefinesAbstract] = members(this, {
      insert: {
        types: [TKey],
        method(key) { },
      },
    })
  }
})

export const MapAssociativeContainerPartOf = genericType(
  (TKey, TMapped) => class MapAssociativeContainerPart
    extends AssociativeContainerPartOf(TKey) {
    static [DefinesAbstract] = members(this, {
      at: {
        types: [TKey],
        method(key) { },
      },

      insertOrAssign: {
        types: [TKey, TMapped],
        method(key, value) { },
      },
    })
  }
)

export const BulkAssignableContainerPartOf = genericType(TValue => {
  const OptionalTValue = OptionalOf(TValue)

  return class BulkAssignableContainerPart extends ClearableContainerPart {
    get defaultValue$() { return undefined }

    static [DefinesAbstract] = members(this, {
      resize: {
        types: [NormalNumber, OptionalTValue],
        defaults: [
          undefined,
          defaultTo(({ self }) => self.defaultValue$),
        ],
        method(count, value /* = this.defaultValue$ */) { },
      },

      assignRange: {
        types: [RangeConcept],
        method(range) { },
      },
    })

    static [Defines] = members(this, {
      assign: {
        types: [NormalNumber, TValue],
        method(count, value) {
          const range = repeat(value, count)
          return this.assignRange(range)
        },
      },
    })

    static {
      compose(this, ClearableContainerPart, {
        clear() {
          return this.resize(0)
        },
      })
    }
  }
})

export const BulkEditableContainerPartOf = genericType(TValue => {
  return class BulkEditableContainerPart
    extends EditableContainerPartOf(TValue) {
    static [DefinesAbstract] = members(this, {
      insertRange: {
        types: [CursorConcept, RangeConcept],
        precondition(cursor, range) {
          this.ownCursorAssert$(cursor)
        },
        method(cursor, range) { },
      },
    })

    static [Defines] = members(this, {
      insertValue: {
        defaults: [
          defaultTo(({ self }) => self.begin()),
        ],
        method(cursor = this.begin(), value) {
          const range = single(value)
          return this.insertRange(cursor, range)
        },
      },

      insert: {
        types: [CursorConcept, NormalNumber, TValue],
        precondition(cursor, count, value) {
          this.ownCursorAssert$(cursor)
        },
        method(cursor, count, value) {
          const range = repeat(value, count)
          return this.insertRange(cursor, range)
        },
      },

      replaceRange: {
        types: [CursorConcept, CursorConcept, RangeConcept],
        precondition(first, last, replacementRange) {
          this.ownCursorPairAssert$(first, last)
        },
        method: thunk({
          transforms: [null, null, sourceRange],
          method(first, last, replacementRange) {
            const cursor = this.erase(first, last)
            return this.insertRange(cursor, replacementRange)
          },
        }),
      },
    })
  }
})

export const PhasedBulkContainerPartOf = genericType(TValue => {
  return class PhasedBulkContainerPart extends PhasedContainerPartOf(TValue) {
    static [DefinesAbstract] = members(this, {
      insertRangeAfter: {
        types: [CursorConcept, RangeConcept],
        precondition(cursor, range) {
          this.ownButNotEndCursorAssert$(cursor)
        },
        method(cursor, range) { },
      },
    })

    static [Defines] = members(this, {
      insertAfter: {
        types: [CursorConcept, NormalNumber, TValue],
        precondition(cursor, count, value) {
          this.ownButNotEndCursorAssert$(cursor)
        },
        method(cursor, count, value) {
          const range = repeat(value, count)
          return this.insertRangeAfter(cursor, range)
        },
      },

      replaceRangeAfter: {
        types: [CursorConcept, CursorConcept, RangeConcept],
        precondition(first, last, replacementRange) {
          this.ownButNotEndCursorAssert$(first)
          this.ownCursorPairAssert$(next(first), last)
        },
        method: thunk({
          transforms: [null, null, sourceRange],
          method(first, last, replacementRange) {
            this.eraseAfter(first, last)
            return this.insertRangeAfter(first, replacementRange)
          },
        }),
      },
    })
  }
})

export const GapEditableContainerPartOf = genericType(TValue => {
  return class GapEditableContainerPart
    extends BulkEditableContainerPartOf(TValue) {
    static [Composes] = SizedContainerPart

    static [DefinesAbstract] = {
      openGap$(cursor, count) { },
      closeGap$(first, last) { },
    }

    static [Defines] = {
      insertRange: thunk({
        transforms: [null, sourceRange],
        method(cursor, range) {
          let first = range.begin()
          let last = range.end()

          if (first instanceof RandomAccessCursorShape == false) {
            range = snapshot(range)
            first = range.begin()
            last = range.end()
          }

          const count = first.distanceTo(last)

          this.openGap$(cursor, count)
          copy(cursor, range)

          return this
        },
      }),
    }

    erase(first, last = next(first)) {
      const result = first.clone()
      this.closeGap$(first, last)
      return result
    }
  }
})

export const GapAssignableContainerPartOf = genericType(TValue => {
  return class GapAssignableContainerPart
    extends BulkAssignableContainerPartOf(TValue) {
    static [Composes] = [
      GapEditableContainerPartOf(TValue),
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

    static [Defines] = {
      assignRange: thunk({
        transforms: [sourceRange],
        method(range) {
          this.clear()
          return this.insertRange(this.begin(), range)
        },
      }),
    }
  }
})
