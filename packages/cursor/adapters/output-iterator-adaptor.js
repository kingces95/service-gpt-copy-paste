import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorConcept } from '../cursor-concept.js'

export class OutputIteratorAdaptor extends PartialProxy {
  #action

  constructor(action) {
    super()
    this.#action = action
  }

  equatableTo(other) { return false }
  set(value) { this.#action(value) }

  static {
    implement(this, CursorConcept, {
      get range() { },
      step() { return this },
    })
  }
}
