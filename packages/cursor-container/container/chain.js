import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { BidirectionalCursorConcept } from '@kingjs/cursor'
import { define } from '@kingjs/partial-define'
import { List } from './list.js'
import { 
  BidirectionalContainerConcept,
  CountableContainerConcept,
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
      // stubs and proxies. 

      // insertAfter(cursor, value) { cursor.link.insertAfter(value) },
      // removeAfter(cursor) { return cursor.link.removeAfter() },

      insertAfter(cursor, value) {
        // List.prototype.insertAfter.call(this, cursor, value)
        cursor.link.insertAfter(value)
        this._count++
      },
      removeAfter(cursor) {
        // const result = List.prototype.removeAfter.call(this, cursor)
        const result = cursor.link.removeAfter()
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
        return this.remove(cursor)
      },
    })

    implement(this, CountableContainerConcept, {
      get count() { return this._count },
    })

    implement(this, EditableContainerConcept, {
      insert(cursor, value) {
        cursor.link.insert(value)
        this._count++
      },
      remove(cursor) {
        const result = cursor.link.remove()
        this._count--
        return result
      }
    })

    implement(this, SpliceableContainerConcept, {
      splice(cursor, outCount = 0, ...values) {
        const beforeCursor = cursor.clone().stepBack()
        while (outCount-- > 0) this.removeAfter(beforeCursor)
        for (let i = values.length - 1; i >= 0; i--)
          this.insertAfter(beforeCursor, values[i])
      },
    })
  }
}
