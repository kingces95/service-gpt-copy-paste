import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { extend } from '@kingjs/partial-extend'
import { ForwardList } from './forward-list.js'
import { 
  BidirectionalCursorConcept, 
  BidirectionalRangeConcept 
} from '@kingjs/cursor'
import { 
  SizedContainerPart,
  EditableContainerPart,
  BulkAssignableContainerPart,
} from '../container-parts.js'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  RewindLink,
} from '../link/rewind-link.js'

class ListCursor extends ForwardList.cursorType {
  static linkType$ = RewindLink

  constructor(container, link) {
    super(container, link)
  }

  static { 
    implement(this, BidirectionalCursorConcept, {
      stepBack() {
        this.link = this.link.previous
        assert(this.link)
        return this
      }    
    }) 
  }
}

export class List extends ForwardList {
  static cursorType = ListCursor
  static {
    implement(this, BidirectionalRangeConcept)
  }
  
  _count

  constructor() {
    super()
    this._count = 0
  }

  static {
    define(this, {
      insertAfter(value, cursor) {
        ForwardList.prototype.insertAfter.call(this, value, cursor)
        this._count++
      },
      eraseAfter(cursor) {
        const result = ForwardList.prototype.eraseAfter.call(this, cursor)
        this._count--
        return result
      },
    })
  }

  static {
    extend(this, SizedContainerPart, {
      get size() { return this._count },
    })

    extend(this, EditableContainerPart, {
      insertAt(value, cursor) {
        cursor.link.insert(value)
        this._count++
      },
      eraseAt(cursor) {
        const result = cursor.clone().step()
        cursor.link.erase()
        this._count--
        return result
      }
    })

    extend(this, BulkAssignableContainerPart, {
      resizeTo(count, value = undefined) {
        while (this.size > count)
          this.pop()

        while (this.size < count)
          this.push(value)

        return this
      },

      assignRange(range) {
        range = this.sourceRange$(range)

        this.clear()
        for (const value of iterate(range))
          this.push(value)

        return this
      },
    })
  }
}
