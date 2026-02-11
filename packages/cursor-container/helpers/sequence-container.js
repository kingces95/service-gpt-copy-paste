import { Concept } from '@kingjs/concept'
import { implement } from '@kingjs/implement'
import { Container } from './container.js'
import {
  EquatableConcept,
} from '@kingjs/concept'
import {
  CursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
} from '@kingjs/cursor'
import { 
  SequenceContainerConcept,
} from '../container-concepts.js'

export class SequenceContainer extends Container {

  static cursorType = class SequenceCursor extends Container.cursorType {

    static api$ = class SequenceContainerConcept$ extends Concept {
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
