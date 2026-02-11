import { Preconditions } from '@kingjs/debug-proxy'
import { implement } from '@kingjs/implement'
import {
  ScopeConcept,
  EquatableConcept,
} from '@kingjs/concept'
import {
  CursorConcept, 
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
} from '@kingjs/cursor'
import { Thunk } from '@kingjs/partial-type'
import { PartialProxy } from '@kingjs/partial-proxy'

export class ContainerCursor {
  static [Preconditions] = class { }
  
  static [Thunk](key, descriptor) {
    return PartialProxy[Thunk].call(this, key, descriptor)
  }

  _container

  constructor(container) {
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
