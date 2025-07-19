import { SequenceContainer } from '../sequence-container.js'
import { RewindCursor } from './rewind-cursor.js'
import {
  throwNotImplemented,
  throwEmpty,
} from '../../../throw.js'

export class RewindContainer extends SequenceContainer {
  static get cursorType$() { return RewindCursor }
  static get thunks$() {
    return Object.setPrototypeOf({
      get back() { if (this.isEmpty$) throwEmpty() },
      pop() { if (this.isEmpty$) throwEmpty() }
    }, super.thunks$)
  }

  constructor() {
    super()
  }

  // cursor implementation
  stepBack$$(token) { throwNotImplemented() }

  // cursor proxy
  stepBack$(token) { 
    return this.stepBack$$(token) 
  }

  // container implementation
  get count$() { throwNotImplemented() }
  get back$() { throwNotImplemented() }
  get isEmpty$() { return this.count == 0 }

  push$(value) { throwNotImplemented() }
  pop$() { throwNotImplemented() }

  // container proxy
  get count() { return this.count$ }
  get back() {
    if (this.isEmpty$) throwEmpty()
    return this.back$
  }

  push(value) { this.push$(value) }
  pop() {
    if (this.isEmpty$) throwEmpty()
    return this.pop$()
  }
}
