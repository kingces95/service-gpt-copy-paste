import { implement } from '@kingjs/partial-implement'
import { ContiguousCursorConcept } from '@kingjs/cursor'
import { IndexableCursor } from './indexable-cursor.js'

export class ContiguousCursor extends IndexableCursor {

  constructor(indexable, index) {
    super(indexable, index)
  }

  static { 
    implement(this, ContiguousCursorConcept, {
      data(other) { return this.container.data(this, other) },      
      readAt(offset = 0, length = 1, signed = false, littleEndian = false) {
        const { container } = this
        const index = this.index + offset
        return container.readAt(index, length, signed, littleEndian)
      },
      writeAt(offset = 0, value, length = 1, signed = false, littleEndian = false) {
        const { container } = this
        const index = this.index + offset
        return container.writeAt(index, value, length, signed, littleEndian)
      }
    }) 
  }
}

