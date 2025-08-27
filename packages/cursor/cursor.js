import { DebugProxy } from '@kingjs/debug-proxy'
import { CursorConcept } from './cursor-concepts'
import { extend } from '@kingjs/partial-class'
import { implement } from '@kingjs/concept'

export class Cursor extends DebugProxy {
  #scope

  constructor(scope) {
    super()
    this.#scope = scope
  }

  get scope$() { return this.#scope }

  static {
    extend(this, { equals$ })

    implement(this, CursorConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.equals$(other)
      },
      equatableTo(other) {
        if (!(other instanceof Cursor)) return false
        return this.scope$ == other.scope$
      },
    })
  }
}

