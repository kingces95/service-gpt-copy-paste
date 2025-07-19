import { Cursor } from '../cursor/cursor.js'
import { implement } from '@kingjs/concept'
import { 
  InputCursorConcept,
  OutputCursorConcept,
} from '../cursor/cursor-concepts.js'

export class ContainerCursor extends Cursor {
  static { 
    implement(this, 
      InputCursorConcept, 
      OutputCursorConcept,
    ) 
  }
  
  __container
  __version

  constructor(container) {
    super()
    this.__container = container
    this.__version = container.__version$
  }

  get __version$() { return this.__version }

  // cursor lifecycle
  recycle$(container) {
    if (container != this.container$) throw new Error(
      "Cursor cannot be recycled to a different container.")

    super.recycle$()
  }

  // container cursor
  get container$() { return this.__container }

  // universal cursor concept implementation
  equatableTo$(other) { 
    return this.container$.equatableTo$(other) 
  }

  // input/output cursor concept implementation
  get value$() { throwNotImplemented() }
  set value$(value) { throwNotImplemented() }

  // input/output cursor concept
  get value() { return this.value$ }
  set value(value) { this.value$ = value }
}
