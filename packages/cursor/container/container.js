import { CursorFactory } from '../cursor/cursor-factory.js'
import { GlobalPrecondition } from '@kingjs/proxy'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotImplemented,
  throwDisposed,
} from '../throw.js'

export class Container extends CursorFactory {
  static [Preconditions] = class extends CursorFactory[Preconditions] { 
    [GlobalPrecondition]() {
      const container = this
      if (container.__isDisposed$) throwDisposed()
    }
  }

  __version
  __disposed

  constructor() { 
    super()
    this.__version = 0
    this.__disposed = false
  }

  get __isDisposed$() { return this.__disposed }

  // A debug helper which detects when a cursor is invalidated. Typically,
  // this happens during an unshift of shift operation as that operation
  // invalidates all index cursors. Cursors that reference a node cannot be
  // invalidated so those containers will not bump the version.
  get __version$() { return this.__version }
  __bumpVersion$() { this.__version++ }
  
  // cursor implementation
  equatableTo$$(otherCursor) { return this == otherCursor.container$ } 

  // cursor proxy
  equatableTo$(otherCursor) {
    return super.equatableTo$(otherCursor)
  }

  // container implementation
  isEmpty$() { throwNotImplemented() }
  dispose$() { }
  
  // dispose implementation
  dispose() {
    this.dispose$()
    this.__disposed = true
    return this
  }
}
