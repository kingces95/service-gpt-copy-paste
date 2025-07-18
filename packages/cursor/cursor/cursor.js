import { DebugProxy, Preconditions } from '../debug-proxy.js'
import {
  throwNotImplemented,
  throwReadOnly,
} from '../throw.js'

export class BaseCursor extends DebugProxy {
  __readOnly

  constructor() {
    super()
    this.__readOnly = false // default to writable
  }

  recycle$() { this.__readOnly = false }

  get isReadOnly() { return this.__readOnly }
  set isReadOnly(value) {
    if (typeof value !== 'boolean') 
      throw new TypeError('isReadOnly must be a boolean.')
    if (this.isReadOnly && !value)
      throw new Error('Cannot make read-only cursor writable.')
    this.__readOnly = value
  }
}

export class Cursor extends BaseCursor {
  static [Preconditions] = class extends BaseCursor[Preconditions] {
    set value(value) {
      if (this.isReadOnly) throwReadOnly()
    }
  }

  // universal cursor concept
  equals$(other) { throwNotImplemented() }
  equatableTo$(other) { throwNotImplemented() }
  step$() { throwNotImplemented() }
  next$() {
    const value = this.value 
    if (!this.step()) return
    return value
  }
  
  // universal cursor concept
  next() { return this.next$() }
  step() { return this.step$() }
  equals(other) {
    if (!other) return false
    if (!this.equatableTo(other)) return false
    return this.equals$(other)
  }
  equatableTo(other) {
    if (this === other) return true
    if (!other) return false
    if (other.constructor != this.constructor) return false
    if (this.isReadOnly != other.isReadOnly) return false
    return this.equatableTo$(other)
  }
}
