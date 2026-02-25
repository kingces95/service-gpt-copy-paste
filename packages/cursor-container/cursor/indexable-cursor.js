import { implement } from '@kingjs/implement'
import { Preconditions, TypePrecondition } from '@kingjs/partial-proxy'
import { EquatableConcept } from '@kingjs/concept'
import { extend } from '@kingjs/partial-extend'
import {
  CursorConcept,
  ForwardRangeConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,

  throwStale,
  throwReadOutOfBounds,
  throwWriteOutOfBounds,
} from '@kingjs/cursor'
import {
  ContainerConcept,
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
} from '../container-concepts.js'
import { ContainerCursor } from './container-cursor.js'

const {
  partialContainerType$: PartialContainer,
} = ContainerCursor

const __version = Symbol('__version')

class PartialIndexableContainer 
  extends PartialContainer {

  static [Preconditions] = {
    shift() { this[__version]++ || 1 },
    unshift(value) { this[__version]++ || 1 },

    at(index) {
      if (index < 0) throwReadOutOfBounds()
      if (index >= this.count) throwReadOutOfBounds()
    },
    setAt(index, value) {
      if (index < 0) throwWriteOutOfBounds()
      if (index >= this.count) throwWriteOutOfBounds()
    },
  }
  
  static [__version] = 0

  static {
    implement(this, ForwardRangeConcept, {
      get cursorType() { return this.constructor.cursorType },
      begin() { return new this.cursorType(this, 0) },
      end() { return new this.cursorType(this, this.count) },
    })

    implement(this, ContainerConcept, {
      get isEmpty() { return this.count == 0 },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this.at(0) },
    }, {
      unshift(value) { },
      shift() { },
    })

    implement(this, RewindContainerConcept, {
      get back() { return this.at(this.count - 1) },
    }, {
      get count() { },
      pop() { },
      push(value) { },
    })

    implement(this, IndexableContainerConcept, { 
      // none
    }, {
      at(index) { },
      setAt(index, value) { },
    })
  }
}

export class IndexableCursor extends ContainerCursor {

  // static [TypePrecondition] = function() {
  //   const { _range, __version } = this
  //   if (_range[__version] !== __version) throwStale()
  // }

  static partialContainerType$ = PartialIndexableContainer

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

