import { SequenceContainer } from '../sequence-container.js'
import { RewindCursor } from './rewind-cursor.js'
import {
  throwNotImplemented
} from '../../../throw.js'

export class RewindContainer extends SequenceContainer {
  static get cursorType$() { return RewindCursor }

  constructor() {
    super()
  }

  // cursor implementation
  stepBack$$(token) { throwNotImplemented() }

  // cursor proxy
  stepBack$(token) { 
    if (this.isDisposed) this.throwDisposed$()
    return this.stepBack$$(token) 
  }

  // container implementation
  get count$() { throwNotImplemented() }
  get back$() { throwNotImplemented() }
  get isEmpty$() { return this.count == 0 }

  push$(value) { throwNotImplemented() }
  pop$() { throwNotImplemented() }

  // container proxy
  get count() {
    if (this.isDisposed) this.throwDisposed$()
    return this.count$
  }
  get back() {
    if (this.isDisposed) this.throwDisposed$()
    if (this.isEmpty$) this.throwEmpty$()
    return this.back$
  }

  push(value) {
    if (this.isDisposed) this.throwDisposed$()
    if (this.isFixedSize) this.throwFixedSize$()
    this.push$(value)
  }
  pop() {
    if (this.isDisposed) this.throwDisposed$()
    if (this.isFixedSize) this.throwFixedSize$()
    if (this.isEmpty$) this.throwEmpty$()
    return this.pop$()
  }
}
