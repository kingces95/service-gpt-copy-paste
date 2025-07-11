import { ViewCursor } from './view-cursor.js'

export class ComposedViewCursor extends ViewCursor {
  #cursor

  constructor(view, cursor) {
    super(view)
    this.#cursor = cursor
  }

  get cursor$() { return this.#cursor }

  recycle$(view, cursor) {
    super.recycle$(view)
    this.#cursor = cursor
    return this
  }
}
