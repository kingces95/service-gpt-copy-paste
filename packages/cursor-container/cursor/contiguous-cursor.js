import { IndexableCursor } from './indexable-cursor.js'
import { implement } from '@kingjs/implement'
import { 
  ContiguousCursorConcept,
} from '@kingjs/cursor'

export class ContiguousCursor extends IndexableCursor {
  constructor(contiguous, index) {
    super(contiguous, index)
  }
  
  static {
    implement(this, ContiguousCursorConcept, {
      readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
        const { container$: contiguous } = this
        return contiguous.readAt$(this, offset, length, signed, littleEndian)
      },
      data(other) {
        const { container$: contiguous, index$: index } = this
        return contiguous.data$(index, other)
      }      
    }) 
  }
}