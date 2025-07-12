import { ContainerCursor } from '../container-cursor.js'
import { CursorAbility } from '../../cursor/cursor-abilitiy.js'

export class SequenceCursor extends ContainerCursor {
  static get abilities() { 
    return CursorAbility.Input 
      | CursorAbility.Output
      | CursorAbility.Forward
  }

  #token

  constructor(container, token) {
    super(container)
    this.#token = token
  }

  // universal cursor proxy
  get __isActive$() { 
    const version = this.__version$
    const token = this.token$
    return this.container$.__isActive$(version, token) 
  }
  get value$() { return this.sequence$.value$(this.token$) }
  set value$(value) { this.sequence$.setAt$(this.token$, value) }
  equals$(other) { return this.sequence$.equals$(this.token$, other) }
  step$() { 
    const result = this.sequence$.step$(this.token$)
    if (result === false) return false
    this.token$ = result
    return true
  }

  // forward cursor proxy
  clone$() {
    const {
      constructor, 
      sequence$: sequence, 
      token$: token 
    } = this

    return new constructor(sequence, token)
  }

  get sequence$() { return this.container$ }
  get token$() { return this.#token }
  set token$(token) { this.#token = token }
}