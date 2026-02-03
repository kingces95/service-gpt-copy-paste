import { implement } from '@kingjs/implement'
import { Concept } from '@kingjs/concept'
import {
  Cursor,
  InputCursorConcept,
  OutputCursorConcept,
} from '@kingjs/cursor'

export class ContainerConcept$ extends Concept {
  get __version$() { }
}

export class ContainerCursor extends Cursor {
  static { 
    implement(this, InputCursorConcept)
    implement(this, OutputCursorConcept) 
  }
  
  #version

  constructor(container) {
    super(container)
    this.#version = container.__version$
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
