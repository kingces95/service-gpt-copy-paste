import { implement } from '@kingjs/concept'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  Cursor,
} from '@kingjs/cursor'
import {
  InputContainerConcept,
  OutputContainerConcept,
} from './container-concepts.js'

export class ContainerCursor extends Cursor {
  static { 
    implement(this, InputContainerConcept)
    implement(this, OutputContainerConcept) 
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
