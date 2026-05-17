import { Cursor } from '../cursor.js'

export class OutputIteratorAdaptor extends Cursor {
  #action

  constructor(action) {
    super()
    this.#action = action
  }

  set(value) { this.#action(value) }
  step() { return this }
  equatableTo(other) { return false }
}
