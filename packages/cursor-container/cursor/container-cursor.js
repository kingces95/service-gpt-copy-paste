import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorConcept } from '@kingjs/cursor'

export class ContainerCursor extends PartialProxy {
  #container
  #token

  constructor(container, token) {
    super()
    this.#container = container
    this.#token = token
  }

  get container() { return this.#container }
  get token() { return this.#token }
  set token(token) { this.#token = token }

  static {
    implement(this, CursorConcept, {
      get range() { return this.container },
    }, {
      step() { return this },
    })
  }
}
