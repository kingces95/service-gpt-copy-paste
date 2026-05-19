import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  CursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  OffsetReadableCursorConcept,
  OffsetWritableCursorConcept,
} from '@kingjs/cursor'
import { ContainerCursor } from './container-cursor.js'

export class IndexableCursor extends ContainerCursor {
  _index

  constructor(indexable, index) {
    super(indexable, index)
    this._index = index
  }

  static { 
    implement(this, EquatableConcept, { 
      equals(other) { 
        if (!this.equatableTo(other)) return false
        return this._index == other._index
      }
    })
    
    implement(this, CursorConcept, { 
      step() { return this.move(1) },
    })

    implement(this, MutableCursorConcept, { 
      get value() { return this.at(0) },
      set value(value) { this.setAt(0, value) },
    })

    implement(this, ForwardCursorConcept, {
      clone() {
        const { constructor, container, _index: index } = this
        return new constructor(container, index)
      }
    })

    implement(this, BidirectionalCursorConcept, {
      stepBack() { return this.move(-1) }    
    }) 

    implement(this, RandomAccessCursorConcept, {
      move(offset) {
        this._index += offset
        return this
      },
      distanceTo(otherCursor) {
        return otherCursor.index - this.index
      },
      compareTo(otherCursor) {
        if (this.index < otherCursor.index) return -1
        if (this.index > otherCursor.index) return 1
        return 0
      },
    }) 

    implement(this, OffsetReadableCursorConcept, {
      at(offset) {
        return this.container.at(this.index + offset)
      },
    })

    implement(this, OffsetWritableCursorConcept, {
      setAt(offset, value) {
        this.container.setAt(this.index + offset, value)
      },
    })
  }

  get index() { return this._index }
}
