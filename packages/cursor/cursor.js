import { DebugProxy } from '@kingjs/debug-proxy'
import { extend } from '@kingjs/partial-extend'
import { implement } from '@kingjs/implement'
import { abstract } from '@kingjs/abstract'
import { CursorConcept } from './cursor-concepts.js'

export class Cursor extends DebugProxy {
  #scope

  constructor(scope) {
    super()
    this.#scope = scope
  }

  get scope$() { return this.#scope }

  static {
    extend(this, { 
      equals$: abstract,
      step$: abstract,
    })

    implement(this, CursorConcept, {
      step() { return this.step$() },
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.equals$(other)
      },
      equatableTo(other) {
        if (other?.constructor != this.constructor) return false
        return this.scope$ == other.scope$
      },
    })
  }
}

