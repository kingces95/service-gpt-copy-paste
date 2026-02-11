import { implement } from '@kingjs/implement'
import { abstract } from '@kingjs/abstract'
import { extend } from '@kingjs/partial-extend'
import { RewindContainer } from '../rewind-container.js'
import { IndexableCursor } from './indexable-cursor.js'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  throwNotImplemented,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
} from '@kingjs/cursor'
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  SequenceContainerConcept$,
  RewindContainerConcept$,
  IndexableContainerConcept$,
} from '../../../container-concepts.js'

export class IndexableContainer extends RewindContainer {
  static [Preconditions] = {
    subtract$(cursor, otherCursor) {
      if (otherCursor.container$ != this) throwNotEquatableTo()
    },
    move$({ index$: index }, offset) {
      if (!this.isInBoundsOrEnd$(index, offset)) throwMoveOutOfBounds()
    },
    compareTo$(cursor, otherCursor) {
      if (otherCursor.container$ != this) throwNotEquatableTo()
    },

    at$$(index, offset) {
      if (!this.isInBounds$(index, offset)) throwReadOutOfBounds()
    },
    setAt$$(index, offset, value) {
      if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    },

    shift() {
      this.__bumpVersion$()
    },
    unshift(value) {
      this.__bumpVersion$()
    }  
  }

  static get cursorType() { return IndexableCursor }

  // A debug helper which detects when a cursor is invalidated. 
  // Typically, this happens during an unshift of shift operation 
  // as that operation invalidates all index cursors. Cursors that 
  // reference a node cannot be invalidated so those containers 
  // will not bump the version.
  __version

  constructor() {
    super()
    this.__version = 0
  }

  __bumpVersion$() { this.__version++ }

  isInBounds$(index, offset) {
    const indexOffset = index + offset
    if (indexOffset < 0) return false
    if (indexOffset >= this.count) return false
    return true
  }
  isInBoundsOrEnd$(index, offset) {
    const indexOffset = index + offset
    return indexOffset == this.count || this.isInBounds$(index, offset)
  }

  static {
    extend(this, {
      at$$/*(index, offset)*/: abstract,
      setAt$$/*(index, offset, value)*/: abstract,
    })
    implement(this, SequenceContainerConcept$, {
      equals$({ index$: index}, { index$: otherIndex }) { 
        return index === otherIndex },
      step$(cursor) { return this.move$(cursor, 1) },
      value$({ index$: index}) { return this.at$$(index, 0) },
      setValue$({ token$: index }, value) { this.setAt$$(index, 0, value) },
    })
    implement(this, RewindContainerConcept$, {
      stepBack$(cursor) { return this.move$(cursor, -1) }
    })
    implement(this, IndexableContainerConcept$, {
      subtract$({ index$: index }, { index$: otherIndex }) { 
        return index - otherIndex },
      move$({ index$: index }, offset) { return index + offset },
      compareTo$({ index$: index }, otherCursor) {
        if (index < otherCursor.index$) return -1
        if (index > otherCursor.index$) return 1
        return 0
      },
      at$({ index$: index }, offset) { 
        return this.at$$(index, offset) },
      setAt$({ index$: index }, offset, value) { 
        this.setAt$$(index, offset, value)
      },
    })
    implement(this, SequenceContainerConcept, {
      get front() { return this.at$$(0, 0) },
      shift() { super.shift() },
      unshift(value) { super.unshift(value) },
    })
    implement(this, RewindContainerConcept, {
      get back() { return this.at$$(this.count - 1, 0) },
      // get count() { },
      // pop() { },
      // push(value) { },
    })
    implement(this, IndexableContainerConcept, {
      at(index) { return this.at$$(0, index) },
      setAt(index, value) { this.setAt$$(0, index, value) },
    })
  }

  // cursor factory
  begin() { return new this.cursorType(this, 0) }
  end() { return new this.cursorType(this, this.count) }
}
