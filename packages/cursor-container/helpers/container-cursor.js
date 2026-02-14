import { implement } from '@kingjs/implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { Preconditions } from '@kingjs/partial-proxy'
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

export class ContainerCursor extends PartialProxy {
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
