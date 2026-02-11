import { implement } from '@kingjs/implement'
import { ContainerCursor } from './container-cursor.js'
import {
  EquatableConcept,
} from '@kingjs/concept'
import {
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