import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorConcept } from '@kingjs/cursor'

export class ViewCursor extends PartialProxy {
  #view

  constructor(view) {
    super()
    this.#view = view
  }

  get view() { return this.#view }

  static {
    implement(this, CursorConcept, {
      get range() { return this.view },
    }, {
      step() { return this },
    })
  }
}
