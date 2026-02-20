import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  throwMoveOutOfBounds,
} from '@kingjs/cursor'
import { List } from './list.js'
import { 
  RewindContainerConcept,
  PrologContainerConcept,
  EpilogContainerConcept,
} from '../container-concepts.js'
import {
  RewindLink,
} from '../helpers/rewind-link.js'
import {
  BidirectionalContainerCursorConcept,
} from '../container-cursor-concepts.js'

class ChainCursor extends List.cursorType {
  static linkType$ = RewindLink

  static [Preconditions] = {
    stepBack() { 
      if (this.equals(this.container.beforeBegin({ const: true })))
        throwMoveOutOfBounds()
    }
  }

  constructor(container, link) {
    super(container, link)
  }

  static { 
    implement(this, BidirectionalContainerCursorConcept, {
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
    implement(this, PrologContainerConcept, {
      insertAfter(cursor, value) {
        super.insertAfter(cursor, value)
        this.count$++
      },
      removeAfter(cursor) {
        const result = super.removeAfter(cursor)
        this.count$--
        return result
      },
    })

    implement(this, RewindContainerConcept, {
      get back() { return this.endLink$.previous.value },
      push(value) { 
        this.insert(this.end(), value),
        this.count$++
      },
      pop() {
        const cursor = this.end()
        cursor.stepBack()
        const result = this.remove(cursor)
        this.count$--
        return result
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
