import { implement } from '@kingjs/implement'
import { ContainerCursor } from '../container-cursor.js'
import {
  EquatableConcept,
  CursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
} from '@kingjs/cursor'

export class SequenceCursor extends ContainerCursor {
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
        return this.container$.equals$(this.token$, other) 
      }
    })
    implement(this, CursorConcept, { 
      step() { 
        this.token$ = this.container$.step$(this.token$)
        return this
      }
    })
    implement(this, MutableCursorConcept, { 
      get value() { 
        return this.container$.value$(this.token$) 
      },
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
}