import { implement } from '@kingjs/implement'
import { DisposeConcept } from '@kingjs/concept'
import { PartialProxy } from '@kingjs/partial-proxy'
import { TypePrecondition } from '@kingjs/partial-proxy'
import {
  throwDisposed,
} from '@kingjs/cursor'

import { ContainerCursor } from '../cursor/container-cursor.js'
import {
  ContainerConcept,
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
    implement(this, ContainerConcept, {
      get cursorType() { return this.constructor.cursorType }
      // begin() { }
      // end() { }
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
