import { SequenceContainer } from '../helpers/sequence-container.js'
import { Preconditions } from '@kingjs/partial-proxy'
import { implement } from '@kingjs/implement'
import {
  throwStale,
  throwNotEquatableTo,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwEmpty,
  BidirectionalCursorConcept,
} from '@kingjs/cursor'
import { 
  SequenceContainerConcept,
  EpilogContainerConcept,
  RewindContainerConcept, 
} from '../container-concepts.js'

export class RewindContainer extends SequenceContainer {
  static [Preconditions] = {
    pop() { if (this.isEmpty) throwEmpty() },
    get back() { if (this.isEmpty) throwEmpty() }  
  }
  
  static cursorType = class RewindCursor 
    extends SequenceContainer.cursorType {
    
    static api$ = class RewindContainerConcept$ 
      extends SequenceContainer.cursorType.api$ {

      static checked$ = class RewindContainerCheckedConcept$ 
        extends this {

        static [Preconditions] = {
          stepBack$({ token$: link }) {
            if (!this.__isActive$(link)) throwStale()
            if (this.__isBeforeBegin$(link)) throwMoveOutOfBounds()
          },

          insert(cursor, value) {
            if (cursor.container$ != this) throwNotEquatableTo()
            if (this.__isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
          },
          remove(cursor) {
            if (cursor.container$ != this) throwNotEquatableTo()
            if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
            if (this.__isBeforeBegin$(cursor.token$)) throwUpdateOutOfBounds()
          },
        }       
      }

      stepBack$(cursor) { } // rewind cursor
    }

    constructor(reversible, token) {
      super(reversible, token)
    }
  
    static { 
      implement(this, BidirectionalCursorConcept, {
        stepBack() {
          const { container$: container } = this
          this.token$ = container.stepBack$(this)
          return this
        }    
      }) 
    }
  }

  static {
    implement(this, RewindContainer.cursorType.api$, {
      // stepBack$(cursor) { }
    })
  }

  static {
    implement(this, SequenceContainerConcept, {
      // get front() { }
      // unshift(value) { }
      // shift() { }
    })

    implement(this, RewindContainerConcept, {
      // get back() { }
      // push(value) { }
      // pop() { }
      // get count() { }
    })
    
    implement(this, EpilogContainerConcept, {
      // insert(cursor, value) { }
      // remove(cursor) { }
    })
  }
}
