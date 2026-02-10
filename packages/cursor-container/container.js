import { implement } from '@kingjs/implement'
import { DisposeConcept } from '@kingjs/concept'
import { PartialProxy } from '@kingjs/partial-proxy'
import { TypePrecondition } from '@kingjs/partial-proxy'
import {
  throwDisposed,
} from '@kingjs/cursor'

import { ContainerCursor } from './container-cursor.js'
import { 
  CursorFactoryConcept, 
} from '../cursor/cursor-concepts.js'
import {
  ContainerConcept$,
} from './container-concepts.js'

export class Container extends PartialProxy {
  static [TypePrecondition]() {
    if (this.isDisposed$) throwDisposed()
  }

  static get cursorType() { return ContainerCursor }

  _disposed

  constructor() { 
    super()
    this._disposed = false
  }

  dispose$() { }
  get isDisposed$() { return this._disposed }

  static {
    implement(this, CursorFactoryConcept, {
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

    implement(this, DisposeConcept, {
      dispose() {
        this.dispose$()
        this._disposed = true
        return this
      }
    })
  }
}
