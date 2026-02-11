import { RewindCursor } from './rewind-cursor.js'
import { implement } from '@kingjs/implement'
import { 
  RandomAccessCursorConcept,
} from '@kingjs/cursor'
import {
  throwStale,
} from '@kingjs/cursor'
import { TypePrecondition } from '@kingjs/partial-type'

export class IndexableCursor extends RewindCursor {
  static [TypePrecondition] = function() {
    const { container$, __version$ } = this
    if (container$.__version$ !== __version$) throwStale()
  }

  __version

  constructor(indexable, index) {
    super(indexable, index)
    this.__version = indexable.__version$
  }

  static { 
    implement(this, RandomAccessCursorConcept, {
      move(offset) {
        const { container$: indexable } = this
        this.index$ = indexable.move$(this, offset)
        return this
      },
      at(offset) {
        const { container$: indexable } = this
        return indexable.at$(this, offset)
      },
      setAt(offset, value) {
        const { container$: indexable } = this
        return indexable.setAt$(this, offset, value)
      },
      subtract(other) {
        const { container$: indexable } = this
        return indexable.subtract$(this, other)
      },
      compareTo(other) {
        const { container$: indexable } = this
        return indexable.compareTo$(this, other)
      }      
    }) 
  }

  get __version$() { return this.__version }

  // random access cursor 
  get index$() { return this.token$ }
  set index$(index) { this.token$ = index }

  // basic cursor
  equals$(other) {
    const { container$: indexable } = this
    return indexable.equals$(this, other)
  }
}