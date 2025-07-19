import { RewindCursor } from '../rewind-cursor.js'
import { implement } from '@kingjs/concept'
import { Preconditions } from '@kingjs/debug-proxy'
import { 
  throwReadOnly,
} from '../../../../throw.js'
import { 
  RandomAccessCursorConcept,
} from '../../../../cursor/cursor-concepts.js'

export class IndexableCursor extends RewindCursor {
  static [Preconditions] = class extends RewindCursor[Preconditions] {
    static { implement(this, RandomAccessCursorConcept[Preconditions]) }
    setAt(offset, value) {
      if (this.isReadOnly) throwReadOnly()
    }
  }

  static { implement(this, RandomAccessCursorConcept) }

  constructor(indexable, index) {
    super(indexable, index)
  }

  // random access cursor 
  get indexable$() { return this.reversible$ }
  get index$() { return this.token$ }
  set index$(index) { this.token$ = index }

  // universal cursor concept implementation
  equals$(other) {
    const { indexable$: indexable, index$: index } = this
    return indexable.equals$(index, other)
  }

  // random access cursor concept implementation
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

  // random access cursor concept
  move(offset) {
    if (offset == 0) return true
    return this.move$(offset)
  }
  at(offset) { return this.at$(offset) }
  setAt(offset, value) { this.setAt$(value, offset) }
  subtract(other) { return this.subtract$(other) }
  compareTo(other) { return this.compareTo$(other) }
}