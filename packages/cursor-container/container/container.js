import { implement } from '@kingjs/implement'
import { DisposeConcept } from '@kingjs/concept'
import { PartialProxy } from '@kingjs/partial-proxy'
import { Preconditions, TypePrecondition } from '@kingjs/partial-proxy'
import {
  ScopeConcept,
  EquatableConcept,
} from '@kingjs/concept'
import {
  CursorConcept, 
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  throwDisposed,
} from '@kingjs/cursor'

import {
  ContainerConcept,
} from './container-concepts.js'

export class Container extends PartialProxy {
  static [TypePrecondition]() {
    if (this.isDisposed$) throwDisposed()
  }

  static cursorType = class ContainerCursor extends PartialProxy {
    static [Preconditions] = class { }
  
    _container
  
    constructor(container) {
      super()
      this._container = container
    }
  
    // container cursor
    get container$() { return this._container }
  
    static { 
      implement(this, ScopeConcept, {
        equatableTo(other) {
          if (other?.constructor != this.constructor) return false
          return this._container == other._container
        }
      })
      implement(this, EquatableConcept, { 
        // equals(other) { }
      })
      implement(this, CursorConcept, { 
        // step() { }
      })
      implement(this, InputCursorConcept, {
        // get value() { }
      })
      implement(this, OutputCursorConcept, {
        // set value(value) { }
      }) 
      implement(this, ForwardCursorConcept, {
        // clone() { }
      })
    }
  }

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
