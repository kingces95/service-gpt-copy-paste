import { assert } from '@kingjs/assert'
import { thunk } from '@kingjs/function-contract'
import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import {
  ForwardListOf,
} from './forward-list.js'
import { genericType } from '@kingjs/generic'
import { 
  BacktrackableCursorConcept,
  BacktrackableCursorPart,
} from '@kingjs/cursor'
import {
  SizedContainerPart,
  EditableContainerPartOf,
  BulkAssignableContainerPartOf,
  PhasedContainerPartOf,
  PhasedBulkContainerPartOf,
  sourceRange,
} from '../container-parts.js'
import { iterate, next } from '@kingjs/cursor-algorithm'
import { RewindLink } from '../link/rewind-link.js'

export const ListOf = genericType([Function],
(
  TValue = Object,
) => {
  const ForwardList = ForwardListOf(TValue)

  class ListCursor extends ForwardList.cursorType {
    constructor(container, link) {
      super(container, link)
    }

    static {
      implement(this, BacktrackableCursorConcept, {
        stepBack() {
          this.link = this.link.previous
          assert(this.link)
          return this
        }
      })
    }

    static {
      compose(this, BacktrackableCursorPart, {
        isAtBegin$() { return this.link == this.container._rootLink },
        canStepBack$() { return this.link != this.container._rootLink },
      })
    }
  }

  return class List extends ForwardList {
    static cursorType = ListCursor
    static valueType = TValue
    static linkType = RewindLink

    _count

    constructor() {
      super()
      this._count = 0
    }

    static {
      compose(this, PhasedContainerPartOf(TValue), {
        beforeBegin() {
          return ForwardList.prototype.beforeBegin.call(this)
        },
        insertValueAfter(cursor, value) {
          ForwardList.prototype.insertValueAfter.call(this, cursor, value)
          this._count++
        },

        eraseAfter(first, last = next(first, 2)) {
          let count = 0
          for (let cursor = next(first); !cursor.equals(last); cursor.step())
            count++

          const result = ForwardList.prototype.eraseAfter.call(this, first, last)
          this._count -= count
          return result
        },
      })

      compose(this, SizedContainerPart, {
        get size() { return this._count },
      })

      compose(this, EditableContainerPartOf(TValue), {
        insertValue(cursor, value) {
          cursor.link.insert(value)
          this._count++
        },

        erase(first, last = next(first)) {
          let count = 0
          let cursor = first.clone()
          while (!cursor.equals(last)) {
            const nextCursor = next(cursor)
            cursor.link.erase()
            cursor = nextCursor
            count++
          }

          this._count -= count
          return last
        }
      })

      compose(this, BulkAssignableContainerPartOf(TValue), {
        get defaultValue$() { return this.constructor.defaultValue },

        resize(count, value = this.constructor.defaultValue) {
          while (this.size > count)
            this.popBack()

          while (this.size < count)
            this.pushBack(value)

          return this
        },

        assignRange: thunk({
          transforms: [sourceRange],
          method(range) {
            this.clear()
            for (const value of iterate(range))
              this.pushBack(value)

            return this
          },
        }),
      })

      compose(this, PhasedBulkContainerPartOf(TValue), {
        insertRangeAfter: thunk({
          transforms: [null, sourceRange],
          method(cursor, range) {
            const tail = cursor.clone()
            for (const value of iterate(range)) {
              tail.link = tail.link.insertAfter(value)
              this._count++
            }

            return this
          },
        }),
      })
    }
  }
})
