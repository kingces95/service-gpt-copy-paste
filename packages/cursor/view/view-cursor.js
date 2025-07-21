import { Cursor } from '../cursor.js'

export class ViewCursor extends Cursor {
  #view

  constructor(view) {
    super()
    this.#view = view
  }

  get view$() { return this.#view }

  recycle$(view) {
    super.recycle$()
    this.#view = view
    return this
  }
}
