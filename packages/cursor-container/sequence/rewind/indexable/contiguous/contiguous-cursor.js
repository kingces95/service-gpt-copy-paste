import { IndexableCursor } from '../indexable-cursor.js'
import { extend } from '@kingjs/partial-extend'
import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import { 
  ContiguousCursorConcept,
} from '@kingjs/cursor'

export class ContiguousCursor extends IndexableCursor {
  static [Preconditions] = class extends IndexableCursor[Preconditions] {
    static { extend(this, ContiguousCursorConcept[Preconditions]) }
  }
  
  static { implement(this, ContiguousCursorConcept) }

  constructor(contiguous, index) {
    super(contiguous, index)
  }

  // contiguous cursor
  readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
    const { container$: contiguous, index$: index } = this
    return contiguous.readAt$(index, offset, length, signed, littleEndian)
  }
  data(other) {
    const { container$: contiguous, index$: index } = this
    return contiguous.data$(index, other)
  }
}