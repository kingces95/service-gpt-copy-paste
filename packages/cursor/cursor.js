import { implement } from '@kingjs/implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { 
  ScopeConcept,
  EquatableConcept,
  CursorConcept 
} from './cursor-concepts.js'
import { PartialProxy } from '@kingjs/partial-proxy'

export class Cursor extends PartialProxy { 
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

