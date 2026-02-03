import { RewindCursor } from '../rewind-cursor.js'
import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import { extend } from '@kingjs/partial-extend'
import { 
  RandomAccessCursorConcept,
} from '@kingjs/cursor'

export class IndexableCursor extends RewindCursor {
  static [Preconditions] = class extends RewindCursor[Preconditions] {
    static { extend(this, RandomAccessCursorConcept[Preconditions]) }
  }

  static { implement(this, RandomAccessCursorConcept) }

  constructor(indexable, index) {
    super(indexable, index)
  }

  // random access cursor 
  get index$() { return this.token$ }
  set index$(index) { this.token$ = index }

  // basic cursor
  equals$(other) {
    const { container$: indexable, index$: index } = this
    return indexable.equals$(index, other)
  }

  // random access cursor
  move(offset) {
    const { container$: indexable, index$: index } = this
    this.index$ = indexable.move$(index, offset)
    return this
  }
  at(offset) {
    const { container$: indexable, index$: index } = this
    return indexable.at$(index, offset)
  }
  setAt(offset, value) {
    const { container$: indexable, index$: index } = this
    return indexable.setAt$(index, offset, value)
  }
  subtract(other) {
    const { container$: indexable, index$: index } = this
    return indexable.subtract$(index, other)
  }
  compareTo(other) {
    const { container$: indexable, index$: index } = this
    return indexable.compareTo$(index, other)
  }
}