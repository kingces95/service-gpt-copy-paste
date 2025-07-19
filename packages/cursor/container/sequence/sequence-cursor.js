import { ContainerCursor } from '../container-cursor.js'
import { implement } from '@kingjs/concept'
import { GlobalPrecondition } from '@kingjs/proxy'
import { Preconditions } from '@kingjs/debug-proxy'
import { 
  ForwardCursorConcept,
} from '../../cursor/cursor-concepts.js'
import {
  throwStale,
} from '../../throw.js'

export class SequenceCursor extends ContainerCursor {
  static [Preconditions] = class extends ContainerCursor[Preconditions] {
    [GlobalPrecondition]() {
      // skip precondition while instance is being activated
      if (!this.__activated) return

      const { container$, __version$, __isActive$ } = this
      if (!__isActive$) throwStale()
      if (container$.__version$ !== __version$) throwStale()
    }
  }

  static { implement(this, ForwardCursorConcept) }

  __token
  __activated

  constructor(container, token) {
    super(container)
    this.__token = token
    this.__activated = true
  }

  get __isActive$() { return this.container$.__isActive$(this.token$) }

  // sequence cursor
  get sequence$() { return this.container$ }
  get token$() { return this.__token }
  set token$(token) { this.__token = token }

  // universal cursor concept implementation
  equals$(other) { return this.sequence$.equals$(this.token$, other) }
  step$() { 
    const result = this.sequence$.step$(this.token$)
    if (result === false) return false
    this.token$ = result
    return true
  }

  // input/output cursor concept implementation
  get value$() { return this.sequence$.value$(this.token$) }
  set value$(value) { this.sequence$.setValue$(this.token$, value) }

  // forward cursor concept implementation
  clone$() {
    const {
      constructor, 
      sequence$: sequence, 
      token$: token 
    } = this

    return new constructor(sequence, token)
  }

  // forward cursor concept
  clone() { return this.clone$() }
}