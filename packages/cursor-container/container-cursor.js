import { implement } from '@kingjs/implement'
import {
  Cursor,
  InputCursorConcept,
  OutputCursorConcept,
} from '@kingjs/cursor'

export class ContainerCursor extends Cursor {
  #version

  constructor(container) {
    super(container)
    this.#version = container.__version$
  }

  static { 
    implement(this, InputCursorConcept)
    implement(this, OutputCursorConcept) 
  }

  get __version$() { return this.#version }

  // cursor lifecycle
  recycle$(container) {
    if (container != this.container$) throw new Error(
      "Cursor cannot be recycled to a different container.")

    super.recycle$()
  }

  // container cursor
  get container$() { return this.scope$ }
}
