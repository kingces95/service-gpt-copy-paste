import { Concept } from '@kingjs/concept'
import { Preconditions } from '@kingjs/partial-proxy'
import { implement } from '@kingjs/implement'
import { Container } from './container.js'
import {
  EquatableConcept,
} from '@kingjs/concept'
import {
  CursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,

  throwStale,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwUpdateOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import { 
  SequenceContainerConcept,
} from '../container-concepts.js'

export class SequenceContainer extends Container {

  static cursorType = class SequenceCursor extends Container.cursorType {

    static api$ = class SequenceContainerConcept$ extends Concept {

      static checked$ = class SequenceContainerCheckedConcept$ extends this {
        static [Preconditions] = {
          setValue$({ token$: link }, value) {
            if (!this.__isActive$(link)) throwStale()
            if (this.__isEnd$(link)) throwWriteOutOfBounds()
            if (this.__isBeforeBegin$(link)) throwWriteOutOfBounds()
          },
          value$({ token$: link }) {
            if (!this.__isActive$(link)) throwStale()
            if (this.__isEnd$(link)) throwReadOutOfBounds()
            if (this.__isBeforeBegin$(link)) throwReadOutOfBounds()
          },
          step$({ token$: link }) {
            if (!this.__isActive$(link)) throwStale()
            if (this.__isEnd$(link)) throwMoveOutOfBounds()
          }, 
        
          insertAfter(cursor, value) {
            if (cursor.container$ != this) throwNotEquatableTo()
            if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
          },
          removeAfter(cursor) {
            if (cursor.container$ != this) throwNotEquatableTo()
            if (this.__isEnd$(cursor.token$)) throwUpdateOutOfBounds()
          }
        }

        __isActive$(link) { }
        __isEnd$(link) { }
        __isBeforeBegin$(link) { }        
      }

      equals$(cursor, other) { } // basic cursor
      step$(cursor) { } // step cursor
      value$(cursor) { } // input cursor
      setValue$(cursor, value) { } // output cursor
    }

    #token
  
    constructor(container, token) {
      super(container)
      this.#token = token
    }
  
    // sequence cursor
    get token$() { return this.#token }
    set token$(token) { this.#token = token }
  
    static { 
      implement(this, EquatableConcept, { 
        equals(other) { 
          if (!this.equatableTo(other)) return false
          const { container$: container } = this
          return container.equals$(this, other) 
        }
      })
      
      implement(this, CursorConcept, { 
        step() { 
          const { container$: container } = this
          this.token$ = container.step$(this)
          return this
        }
      })

      implement(this, MutableCursorConcept, { 
        get value() { 
          const { container$: container } = this
          return container.value$(this) 
        },
        set value(value) { 
          const { container$: container } = this
          container.setValue$(this, value) 
        }
      })

      implement(this, ForwardCursorConcept, {
        clone() {
          const {
            constructor, 
            container$: sequence, 
            token$: token 
          } = this
  
          return new constructor(sequence, token)
        }
      }) 
    }
  }

  static {
    implement(this, SequenceContainer.cursorType.api$, {
      // equals$(cursor, other) { }
      // step$(cursor) { }
      // value$(cursor) { }
      // setValue$(cursor, value) { }
    })
  }

  static {
    implement(this, SequenceContainerConcept, {
      // get front() { }
      // unshift(value) { }
      // shift() { }
    })
  }
}
