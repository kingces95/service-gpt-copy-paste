import { Container } from '../container.js'
import { SequenceCursor } from './sequence-cursor.js'
import {
  throwNotImplemented,
  throwEmpty,
} from '../../throw.js'

export class SequenceContainer extends Container {
  static get cursorType$() { return SequenceCursor }

  constructor() {
    super()
  }

  // cursor implementation
  __isActive$$(token) { return true }
  value$$(token) { throwNotImplemented() }
  setValue$$(token, value) { throwNotImplemented() }
  step$$(token) { throwNotImplemented() }
  equals$$(token, otherCursor) { throwNotImplemented() }
  
  // cursor proxy
  __isActive$(token) { return this.__isActive$$(token) } 
  step$(token) { return this.step$$(token) }
  value$(token) { return this.value$$(token) }
  setValue$(token, value) { this.setValue$$(token, value) }
  equals$(token, otherCursor) { 
    return this.equals$$(token, otherCursor) 
  }

  // container implementation
  get front$() { throwNotImplemented() }

  unshift$(value) { throwNotImplemented() }
  shift$() { throwNotImplemented() }

  // container proxy
  get isEmpty() { return this.isEmpty$ }
  get front() { 
    if (this.isEmpty$) throwEmpty()
    return this.front$ 
  }

  unshift(value) { this.unshift$(value) }
  shift() {
    if (this.isEmpty$) throwEmpty()
    return this.shift$()
  }
}
