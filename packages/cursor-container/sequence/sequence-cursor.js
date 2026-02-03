import { implement } from '@kingjs/implement'
import { ContainerCursor } from '../container-cursor.js'
import { implement } from '@kingjs/implement'
import { GlobalPrecondition } from '@kingjs/proxy'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  throwStale,
} from '@kingjs/cursor'

export class SequenceCursor extends ContainerCursor {
  static [Preconditions] = class extends ContainerCursor[Preconditions] {
    [GlobalPrecondition]() {
      const { container$, __version$, __isActive$ } = this
      if (!__isActive$) throwStale()
      if (container$.__version$ !== __version$) throwStale()
    }
  }

  #token

  constructor(container, token) {
    super(container)
    this.#token = token
  }

  static { 
    implement(this, CursorConcept, { })
    implement(this, InputCursorConcept, { 
      get value() { return this.container$.value$(this.token$) }
    })
    implement(this, OutputCursorConcept, { 
      set value(value) { this.container$.setValue$(this.token$, value) }
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

  get __isActive$() { return this.container$.__isActive$(this.token$) }

  // sequence cursor
  get token$() { return this.#token }
  set token$(token) { this.#token = token }

  // basic cursor
  equals$(other) { return this.container$.equals$(this.token$, other) }
  step$() { 
    this.token$ = this.container$.step$(this.token$)
    return this
  }
}