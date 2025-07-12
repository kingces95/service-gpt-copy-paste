import { Container } from '../container.js'
import { SequenceCursor } from './sequence-cursor.js'
import {
  throwNotImplemented,
  throwUnequatable
} from '../../throw.js'

export class SequenceContainer extends Container {

  static get cursorType$() { return SequenceCursor }

  constructor() {
    super()
  }

  // cursor implementation
  value$$(token) { throwNotImplemented() }
  setAt$$(token, value) { throwNotImplemented() }
  step$$(token) { throwNotImplemented() }
  equals$$(token, otherCursor) { throwNotImplemented() }
  
  // cursor proxy
  __isActive$(version, token) { return this.__isActive$$(version, token) } 
  step$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    return this.step$$(token) 
  }
  value$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    return this.value$$(token) 
  }
  setAt$(token, value) { 
    if (this.isDisposed) this.throwDisposed$()
    this.setAt$$(token, value) 
  }
  equals$(token, otherCursor) { 
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) throwUnequatable()
    return this.equals$$(token, otherCursor) 
  }

  throwFixedSize$() { throw new RangeError(
    `Cannot modify a fixed size sequence container.`) }

  // container implementation
  get front$() { throwNotImplemented() }

  unshift$(value) { throwNotImplemented() }
  shift$() { throwNotImplemented() }

  // container proxy
  get isEmpty() {
    if (this.isDisposed) this.throwDisposed$()
    return this.isEmpty$
  }
  get front() { 
    if (this.isDisposed) this.throwDisposed$()
    if (this.isEmpty$) this.throwEmpty$()
    return this.front$ 
  }

  unshift(value) {
    if (this.isDisposed) this.throwDisposed$()
    if (this.isFixedSize) this.throwFixedSize$()
    this.unshift$(value)
  }
  shift() {
    if (this.isDisposed) this.throwDisposed$()
    if (this.isFixedSize) this.throwFixedSize$()
    if (this.isEmpty$) this.throwEmpty$()
    return this.shift$()
  }
}
