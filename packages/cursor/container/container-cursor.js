import { Cursor } from '../cursor/cursor.js'
import { implement } from '@kingjs/concept'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNotImplemented,
  throwReadOnly,
} from '../throw.js'
import { 
  InputCursorConcept,
  OutputCursorConcept,
} from '../cursor/cursor-concepts.js'

export class ContainerCursor extends Cursor {
  static [Preconditions] = class extends Cursor[Preconditions] {
    set value(value) {
      if (this.isReadOnly) throwReadOnly()
    }
  }

  static { 
    implement(this, 
      InputCursorConcept, 
      OutputCursorConcept,
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
