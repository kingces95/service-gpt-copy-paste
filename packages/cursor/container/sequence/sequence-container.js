import { Container } from '../container.js'
import { SequenceCursor } from './sequence-cursor.js'

export class SequenceContainer extends Container {

  static get cursorType$() { return SequenceCursor }

  constructor() {
    super()
  }

  // cursor implementation
  isEnd$$(token) { this.throwNotImplemented$() }
  isBegin$$(token) { this.throwNotImplemented$() }
  isBeforeBegin$$(token) { return false }
  value$$(token) { this.throwNotImplemented$() }
  setAt$$(token, value) { this.throwNotImplemented$() }
  step$$(token) { this.throwNotImplemented$() }
  equals$$(token, otherCursor) { this.throwNotImplemented$() }
  
  // cursor proxy
  __isActive$(version, token) { return this.__isActive$$(version, token) } 
  isEnd$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    return this.isEnd$$(token) 
  }
  isBegin$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    return this.isBegin$$(token) 
  }
  isBeforeBegin$(token) {
    if (this.isDisposed) this.throwDisposed$()
    return this.isBeforeBegin$$(token)
  } 
  step$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    if (this.isEnd$(token)) return false
    return this.step$$(token) 
  }
  value$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    return this.value$$(token) 
  }
  setAt$(token, value) { 
    if (this.isDisposed) this.throwDisposed$()
    if (this.isEnd$(token)) this.throwWriteOutOfBounds$()
    this.setAt$$(token, value) 
  }
  equals$(token, otherCursor) { 
    if (this.isDisposed) this.throwDisposed$()
    if (!this.equatableTo$(otherCursor)) this.throwUnequatable$()
    return this.equals$$(token, otherCursor) 
  }

  throwFixedSize$() { throw new RangeError(
    `Cannot modify a fixed size sequence container.`) }

  // container implementation
  get front$() { this.throwNotImplemented$() }

  unshift$(value) { this.throwNotImplemented$() }
  shift$() { this.throwNotImplemented$() }

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
