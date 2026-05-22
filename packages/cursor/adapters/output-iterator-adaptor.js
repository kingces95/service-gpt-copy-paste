import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorConcept } from '../cursor-concept.js'

export class OutputIteratorAdaptor extends PartialProxy {
  #action

  constructor(action) {
    super()
    this.#action = action
  }

  set(value) { this.#action(value) }

  static {
    implement(this, CursorConcept, {
      step() { return this },
      equatableTo(other) { return false },
    }, {
      get range() { },
    })
  }
}
