import { Cursor } from '@kingjs/cursor'

export class ViewCursor extends Cursor {
  #view

  constructor(view) {
    super()
    this.#view = view
  }

  get view$() { return this.#view }
}
