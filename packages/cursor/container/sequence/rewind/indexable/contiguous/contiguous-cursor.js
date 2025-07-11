import { IndexableCursor } from './../indexable-cursor.js'
import { CursorAbility } from '../../../../../cursor/cursor-abilitiy.js'

export class ContiguousCursor extends IndexableCursor {
  static get abilities() { 
    return IndexableCursor.abilities
      | CursorAbility.Contiguous
  }

  constructor(container, index) {
    super(container, index)
  }

  get contiguous$() { return this.indexable$ }

  readAt$(offset = 0, length = 1, signed = false, littleEndian = false) {
    const { contiguous$: contiguous, index$: index } = this
    return contiguous.readAt$(index, offset, length, signed, littleEndian)
  }
  data$(other) {
    const { contiguous$: contiguous, index$: index } = this
    return contiguous.data$(index, other)
  }
}