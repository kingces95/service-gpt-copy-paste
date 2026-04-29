import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  CursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
} from '@kingjs/cursor'
import { ContainerCursor } from './container-cursor.js'

const __version = Symbol('__version')

export class IndexableCursor extends ContainerCursor {

  // static [TypePrecondition] = function() {
  //   const { _range, __version } = this
  //   if (_range[__version] !== __version) throwStale()
  // }

  __version
  _index

  constructor(indexable, index) {
    super(indexable, index)
    this._index = index
    this.__version = indexable[__version]
  }

  get __version$() { return this.__version }

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
      at(offset) {
        return this.container.at(this.index + offset)
      },
      setAt(offset, value) {
        this.container.setAt(this.index + offset, value)
      },
      subtract(otherCursor) {
        return this.index - otherCursor.index
      },
      compareTo(otherCursor) {
        if (this.index < otherCursor.index) return -1
        if (this.index > otherCursor.index) return 1
        return 0
      },
    }) 
  }

  get index() { return this._index }
}

