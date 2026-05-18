import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { extend } from '@kingjs/partial-extend'
import { List } from './list.js'
import { 
  BidirectionalCursorConcept, 
  BidirectionalRangeConcept 
} from '@kingjs/cursor'
import { 
  SizedContainerPart,
  EditableContainerPart,
} from '../container-parts.js'
import {
  RewindLink,
} from '../link/rewind-link.js'

class ChainCursor extends List.cursorType {
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

export class Chain extends List {
  static cursorType = ChainCursor
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
        List.prototype.insertAfter.call(this, value, cursor)
        this._count++
      },
      eraseAfter(cursor) {
        const result = List.prototype.eraseAfter.call(this, cursor)
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
  }
}
