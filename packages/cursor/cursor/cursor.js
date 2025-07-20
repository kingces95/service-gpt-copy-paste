import { DebugProxy, Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotImplemented,
} from '../throw.js'

export class BaseCursor extends DebugProxy {
  #readOnly

  constructor() {
    super()
    this.#readOnly = false // default to writable
  }

  recycle$() { this.#readOnly = false }

  get isReadOnly() { return this.#readOnly }
  set isReadOnly(value) {
    if (typeof value !== 'boolean') 
      throw new TypeError('isReadOnly must be a boolean.')
    if (this.isReadOnly && !value)
      throw new Error('Cannot make read-only cursor writable.')
    this.#readOnly = value
  }

  // cursor concept
  equals$(other) { throwNotImplemented() }
  equals(other) {
    if (!other) return false
    if (!this.equatableTo(other)) return false
    return this.equals$(other)
  }

  equatableTo$(other) { throwNotImplemented() }
  equatableTo(other) {
    if (this === other) return true
    if (!other) return false
    if (other.constructor != this.constructor) return false
    if (this.isReadOnly != other.isReadOnly) return false
    return this.equatableTo$(other)
  }
}

export class Cursor extends BaseCursor {
  
  // step cursor concept
  step$() { throwNotImplemented() }
  step() { return this.step$() }

  next$() {
    const value = this.value 
    if (!this.step()) return
    return value
  }
  next() { return this.next$() }
}
