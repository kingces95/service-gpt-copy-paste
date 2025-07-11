import { RewindCursor } from '../rewind-cursor.js'
import { CursorAbility } from '../../../../cursor/cursor-abilitiy.js'

export class IndexableCursor extends RewindCursor {
  static get abilities() { 
    return RewindCursor.abilities
      | CursorAbility.RandomAccess
  }

  constructor(sequence, index) {
    super(sequence, index)
  }

  get indexable$() { return this.sequence$ }
  get index$() { return this.token$ }
  set index$(index) { this.token$ = index }

  recycle$(indexable, index) {
    super.recycle$(indexable, index)
    return this
  }
  move$(offset) {
    const { indexable$: indexable, index$: index } = this
    const result = indexable.move$(index, offset)
    if (result === false) return false
    this.index$ = result
    return true
  }
  at$(offset) {
    const { indexable$: indexable, index$: index } = this
    return indexable.at$(index, offset)
  }
  setAt$(offset, value) {
    const { indexable$: indexable, index$: index } = this
    return indexable.setAt$(index, offset, value)
  }
  compareTo$(other) {
    const { indexable$: indexable, index$: index } = this
    return indexable.compareTo$(index, other)
  }
  subtract$(other) {
    const { indexable$: indexable, index$: index } = this
    return indexable.subtract$(index, other)
  }
  equals$(other) {
    const { indexable$: indexable, index$: index } = this
    return indexable.equals$(index, other)
  }
}