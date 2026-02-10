import { DebugProxy } from '@kingjs/debug-proxy'
import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import {
  throwDisposed,
} from '@kingjs/cursor'
import { 
  CursorFactory,
  IntervalConcept, 
} from '../cursor/cursor-factory.js'
import { ContainerCursor } from './container-cursor.js'
import {
  ContainerConcept$,
} from './container-concepts.js'
import {
  PartialProxy
} from '@kingjs/partial-proxy'
import {
  Thunk,
  TypePrecondition,
} from '@kingjs/partial-type'

export class Container extends DebugProxy {
  static [Thunk](key, descriptor) {
    return PartialProxy[Thunk].call(this, key, descriptor)
  }

  static [TypePrecondition]() {
    const container = this
    if (container.isDisposed$) 
      throwDisposed()
  }

  static get cursorType() { return ContainerCursor }

  _disposed

  constructor() { 
    super()
    this._disposed = false
  }

  static {
    implement(this, IntervalConcept, {
      get cursorType() { return this.constructor.cursorType },
      // begin() { }
      // end() { }
    })
    implement(this, ContainerConcept$, {
      // A debug helper which detects when a cursor is invalidated. 
      // Typically, this happens during an unshift of shift operation 
      // as that operation invalidates all index cursors. Cursors that 
      // reference a node cannot be invalidated so those containers 
      // will not bump the version.
      get __version$() { return this.__version }
    })

    extend(this, {
      dispose() {
        this.dispose$()
        this._disposed = true
        return this
      }
    })
  }

  get isDisposed$() { return this._disposed }

  // container methods
  // dispose$() { }
  // dispose() {
  //   this.dispose$()
  //   this._disposed = true
  //   return this
  // }
}
