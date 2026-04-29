import { Cursor } from '@kingjs/cursor'

export class ContainerCursor extends Cursor {
  #token

  constructor(container, token) {
    super(container)
    this.#token = token
  }

  get container() { return this.range }
  get token() { return this.#token }
  set token(token) { this.#token = token }
}
