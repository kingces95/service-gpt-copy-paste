import { assert } from '@kingjs/assert'
import { contract } from '@kingjs/function-contract'
import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import { ForwardList } from './forward-list.js'
import { 
  BacktrackableCursorConcept,
  BacktrackableCursorPart,
} from '@kingjs/cursor'
import { 
  SizedContainerPart,
  EditableContainerPart,
  BulkAssignableContainerPart,
  PhasedContainerPart,
  PhasedBulkContainerPart,
  sourceRange,
} from '../container-parts.js'
import { iterate, next } from '@kingjs/cursor-algorithm'
import {
  RewindLink,
} from '../link/rewind-link.js'

class ListCursor extends ForwardList.cursorType {
  static linkType$ = RewindLink

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
    extend(this, BacktrackableCursorPart, {
      isAtBegin$() { return this.link == this.container._rootLink },
      canStepBack$() { return this.link != this.container._rootLink },
    })
  }
}

export class List extends ForwardList {
  static cursorType = ListCursor
  _count

  constructor() {
    super()
    this._count = 0
  }

  static {
    extend(this, PhasedContainerPart, {
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

    extend(this, SizedContainerPart, {
      get size() { return this._count },
    })

    extend(this, EditableContainerPart, {
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

    extend(this, BulkAssignableContainerPart, {
      resize(count, value = undefined) {
        while (this.size > count)
          this.popBack()

        while (this.size < count)
          this.pushBack(value)

        return this
      },

      assignRange: contract({
        transforms: [sourceRange],
      },
      function assignRange(range) {
        this.clear()
        for (const value of iterate(range))
          this.pushBack(value)

        return this
      }),
    })

    extend(this, PhasedBulkContainerPart, {
      insertRangeAfter: contract({
        transforms: [null, sourceRange],
      },
      function insertRangeAfter(cursor, range) {
        const tail = cursor.clone()
        for (const value of iterate(range)) {
          tail.link = tail.link.insertAfter(value)
          this._count++
        }

        return this
      }),

    })

  }
}
