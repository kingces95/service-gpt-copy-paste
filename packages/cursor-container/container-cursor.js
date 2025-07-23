import { implement } from '@kingjs/partial-class'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  Cursor,
  throwReadOnly,
} from '@kingjs/cursor'
import {
  InputContainerConcept,
  OutputContainerConcept,
} from './container-concepts.js'

export class ContainerCursor extends Cursor {
  static [Preconditions] = class extends Cursor[Preconditions] {
    set value(value) {
      if (this.isReadOnly) throwReadOnly()
    }
  }

  static { 
    implement(this, 
      InputContainerConcept, 
      OutputContainerConcept,
    ) 
  }
  
  #container
  #version

  constructor(container) {
    super()
    this.#container = container
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
  get container$() { return this.#container }

  // basic cursor
  equatableTo$(other) { 
    return this.container$.equatableTo$(other) 
  }
}
