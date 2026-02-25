import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { BidirectionalCursorConcept } from '@kingjs/cursor'
import { extend } from '@kingjs/partial-extend'
import { List } from './list.js'
import { 
  RewindContainerConcept,
  EpilogContainerConcept,
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
  
  count$

  constructor() {
    super()
    this.count$ = 0
  }

  dispose$() {
    super.dispose$()
    this.count$ = 0
  }

  static {
    extend(this, {
      // TODO: Loader installs stubs so type.prototype does not work. Need
      // to update loader to attach a static [Prototype] symbol that contains
      // the original methods so super methods can be addressed stripped of
      // stubs and proxies. 

      // insertAfter(cursor, value) { cursor.link.insertAfter(value) },
      // removeAfter(cursor) { return cursor.link.removeAfter() },

      insertAfter(cursor, value) {
        // List.prototype.insertAfter.call(this, cursor, value)
        cursor.link.insertAfter(value)
        this.count$++
      },
      removeAfter(cursor) {
        // const result = List.prototype.removeAfter.call(this, cursor)
        const result = cursor.link.removeAfter()
        this.count$--
        return result
      },
    })

    implement(this, RewindContainerConcept, {
      get back() { return this.endLink$.previous.value },
      get count() { return this.count$ },
      push(value) { 
        this.insert(this.end(), value)
      },
      pop() {
        const cursor = this.end()
        cursor.stepBack()
        return this.remove(cursor)
      },
    })

    implement(this, EpilogContainerConcept, {
      insert(cursor, value) {
        cursor.link.insert(value)
        this.count$++
      },
      remove(cursor) {
        const result = cursor.link.remove()
        this.count$--
        return result
      }
    })
  }
}
