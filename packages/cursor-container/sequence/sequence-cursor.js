import { implement } from '@kingjs/implement'
import { ContainerCursor } from '../container-cursor.js'
import { implement } from '@kingjs/implement'
import {
  EquatableConcept,
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
} from '@kingjs/cursor'

export class SequenceCursor extends ContainerCursor {
  #token

  constructor(container, token) {
    super(container)
    this.#token = token
  }

  static { 
    implement(this, EquatableConcept, { 
      equals(other) { 
        if (!this.equatableTo(other)) return false
        return this.container$.equals$(this.token$, other) 
      }
    })
    implement(this, CursorConcept, { 
      step() { 
        this.token$ = this.container$.step$(this.token$)
        return this
      }
    })
    implement(this, InputCursorConcept, { 
      get value() { 
        return this.container$.value$(this.token$) 
      }
    })
    implement(this, OutputCursorConcept, { 
      set value(value) { 
        this.container$.setValue$(this.token$, value) 
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

  // sequence cursor
  get token$() { return this.#token }
  set token$(token) { this.#token = token }
}