import { DebugProxy } from '@kingjs/debug-proxy'
import { implement } from '@kingjs/implement'
import { 
  ScopeConcept,
  EquatableConcept,
  CursorConcept 
} from './cursor-concepts.js'
import { PartialProxy } from '@kingjs/partial-proxy'
import {
  Thunk,
  TypePrecondition,
} from '@kingjs/partial-type'

export class Cursor extends DebugProxy {
  static [Thunk](key, descriptor) {
    return PartialProxy[Thunk].call(this, key, descriptor)
  }
  
  #scope

  constructor(scope) {
    super()
    this.#scope = scope
  }

  get scope$() { return this.#scope }

  static {
    implement(this, ScopeConcept, {
      equatableTo(other) {
        if (other?.constructor != this.constructor) return false
        return this.scope$ == other.scope$
      }
    })
    implement(this, EquatableConcept, { 
      // equals(other) { }
    })
    implement(this, CursorConcept, { 
      // step() { }
    })
  }
}

