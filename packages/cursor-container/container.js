import { Concept } from '@kingjs/concept'
import { CursorFactory } from '../cursor/cursor-factory.js'
import { GlobalPrecondition } from '@kingjs/proxy'
import { Preconditions } from '@kingjs/debug-proxy'
import { implement } from '@kingjs/implement'
import {
  throwDisposed,
} from '@kingjs/cursor'
import {
  ContainerConcept$,
} from './container-concepts.js'

export class Container extends CursorFactory {
  static [Preconditions] = class extends CursorFactory[Preconditions] { 
    [GlobalPrecondition]() {
      const container = this
      if (container.isDisposed$) throwDisposed()
    }
  }

  _version
  _disposed

  constructor() { 
    super()
    this._version = 0
    this._disposed = false
  }

  static {
    implement(this, ContainerConcept$, {
      // A debug helper which detects when a cursor is invalidated. 
      // Typically, this happens during an unshift of shift operation 
      // as that operation invalidates all index cursors. Cursors that 
      // reference a node cannot be invalidated so those containers 
      // will not bump the version.
      get __version$() { return this._version }
    })
  }

  get isDisposed$() { return this._disposed }

  __bumpVersion$() { this._version++ }

  // container methods
  // dispose$() { }
  dispose() {
    this.dispose$()
    this._disposed = true
    return this
  }
}
