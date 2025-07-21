import { ContainerCursor } from '../container-cursor.js'
import { implement } from '@kingjs/concept'
import { GlobalPrecondition } from '@kingjs/proxy'
import { Preconditions } from '@kingjs/debug-proxy'
import {
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

  static { implement(this, ForwardCursorConcept) }

  #token

  constructor(container, token) {
    super(container)
    this.#token = token
  }

  get __isActive$() { return this.container$.__isActive$(this.token$) }

  // sequence cursor
  get token$() { return this.#token }
  set token$(token) { this.#token = token }

  // basic cursor
  equals$(other) { return this.container$.equals$(this.token$, other) }
  
  // step cursor
  step$() { 
    this.token$ = this.container$.step$(this.token$)
    return this
  }

  // input cursor
  get value() { return this.container$.value$(this.token$) }

  // output cursor
  set value(value) { this.container$.setValue$(this.token$, value) }

  // forward cursor
  clone() {
    const {
      constructor, 
      container$: sequence, 
      token$: token 
    } = this

    return new constructor(sequence, token)
  }
}