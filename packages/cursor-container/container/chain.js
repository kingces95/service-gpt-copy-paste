import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { BidirectionalCursorConcept } from '@kingjs/cursor'
import { define } from '@kingjs/partial-define'
import { List } from './list.js'
import { 
  BidirectionalContainerConcept,
  SizedContainerConcept,
  BackEditableContainerConcept,
  SpliceableContainerConcept,
  EditableContainerConcept,
} from '../container-concepts.js'
import {
  RewindLink,
} from '../helpers/rewind-link.js'

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
  
  _count

  constructor() {
    super()
    this._count = 0
  }

  dispose$() {
    super.dispose$()
    this._count = 0
  }

  static {
    define(this, {
      // TODO: Loader installs stubs so type.prototype does not work. Need
      // to update loader to attach a static [Prototype] symbol that contains
      // the original methods so super methods can be addressed stripped of
      // stubs and proxies. OR make the proxies detect a super call and forward
      // to the original method.

      // insertAfter(cursor, value) { cursor.link.insertAfter(value) },
      // eraseAfter(cursor) { return cursor.link.eraseAfter() },

      insertAfter(cursor, value) {
        // List.prototype.insertAfter.call(this, cursor, value)
        cursor.link.insertAfter(value)
        this._count++
      },
      eraseAfter(cursor) {
        // const result = List.prototype.eraseAfter.call(this, cursor)
        const result = cursor.link.eraseAfter()
        this._count--
        return result
      },
    })

    implement(this, BidirectionalContainerConcept)

    implement(this, BackEditableContainerConcept, {
      get back() { return this.endLink$.previous.value },
      push(value) { 
        this.insert(this.end(), value)
      },
      pop() {
        const cursor = this.end()
        cursor.stepBack()
        const result = cursor.value
        this.erase(cursor)
        return result
      },
    })

    implement(this, SizedContainerConcept, {
      get count() { return this._count },
    })

    implement(this, EditableContainerConcept, {
      insert(cursor, value) {
        cursor.link.insert(value)
        this._count++
      },
      erase(cursor) {
        const result = cursor.clone().step()
        cursor.link.erase()
        this._count--
        return result
      }
    })

    implement(this, SpliceableContainerConcept, {
      splice(cursor, outCount = 0, ...values) {
        const beforeCursor = cursor.clone().stepBack()
        while (outCount-- > 0) this.eraseAfter(beforeCursor)
        for (let i = values.length - 1; i >= 0; i--)
          this.insertAfter(beforeCursor, values[i])
      },
    })
  }
}
