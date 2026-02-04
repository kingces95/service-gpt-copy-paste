import { RewindCursor } from '../rewind-cursor.js'
import { implement } from '@kingjs/implement'
import { Preconditions } from '@kingjs/debug-proxy'
import { extend } from '@kingjs/partial-extend'
import { GlobalPrecondition } from '@kingjs/proxy'
import { 
  RandomAccessCursorConcept,
} from '@kingjs/cursor'
import {
  throwStale,
} from '@kingjs/cursor'

export class IndexableCursor extends RewindCursor {
  static [Preconditions] = class extends RewindCursor[Preconditions] {
    static { extend(this, RandomAccessCursorConcept[Preconditions]) }

    [GlobalPrecondition]() {
      const { container$, __version$ } = this
      if (container$.__version$ !== __version$) throwStale()
    }
  }

  _version

  constructor(indexable, index) {
    super(indexable, index)
    this._version = indexable.__version$
  }

  static { 
    implement(this, RandomAccessCursorConcept, {
      move(offset) {
        const { container$: indexable, index$: index } = this
        this.index$ = indexable.move$(index, offset)
        return this
      },
      at(offset) {
        const { container$: indexable, index$: index } = this
        return indexable.at$(index, offset)
      },
      setAt(offset, value) {
        const { container$: indexable, index$: index } = this
        return indexable.setAt$(index, offset, value)
      },
      subtract(other) {
        const { container$: indexable, index$: index } = this
        return indexable.subtract$(index, other)
      },
      compareTo(other) {
        const { container$: indexable, index$: index } = this
        return indexable.compareTo$(index, other)
      }      
    }) 
  }

  // random access cursor 
  get index$() { return this.token$ }
  set index$(index) { this.token$ = index }

  // basic cursor
  equals$(other) {
    const { container$: indexable, index$: index } = this
    return indexable.equals$(index, other)
  }
}