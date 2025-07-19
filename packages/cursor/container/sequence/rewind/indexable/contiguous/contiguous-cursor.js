import { IndexableCursor } from './../indexable-cursor.js'
import { implement } from '@kingjs/concept'
import { Preconditions } from '@kingjs/debug-proxy'
import { 
  ContiguousCursorConcept,
} from '../../../../../cursor/cursor-concepts.js'

export class ContiguousCursor extends IndexableCursor {
  static [Preconditions] = class extends IndexableCursor[Preconditions] {
    static { implement(this, ContiguousCursorConcept[Preconditions]) }
  }
  
  static { implement(this, ContiguousCursorConcept) }

  constructor(contiguous, index) {
    super(contiguous, index)
  }

  // contiguous cursor
  get contiguous$() { return this.indexable$ }

  // contiguous cursor concept implementation
  readAt$(offset = 0, length = 1, signed = false, littleEndian = false) {
    const { contiguous$: contiguous, index$: index } = this
    return contiguous.readAt$(index, offset, length, signed, littleEndian)
  }
  data$(other) {
    const { contiguous$: contiguous, index$: index } = this
    return contiguous.data$(index, other)
  }

  // contiguous cursor concept
  readAt(offset = 0, length = 1, signed = false, littleEndian = false) { 
    return this.readAt$(offset, length, signed, littleEndian)
  }
  data(other) { 
    return this.data$(other)
  }
}