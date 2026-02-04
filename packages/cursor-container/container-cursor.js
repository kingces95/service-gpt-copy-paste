import { DebugProxy } from '@kingjs/debug-proxy'
import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  ScopeConcept,
  EquatableConcept,
  CursorConcept, 
  InputCursorConcept,
  OutputCursorConcept,
} from '@kingjs/cursor'

export class ContainerCursor extends DebugProxy {
  static [Preconditions] = class { }

  _container

  constructor(container) {
    super()
    this._container = container
  }

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
  }

  get __version$() { return this._version }

  // container cursor
  get container$() { return this._container }
}
