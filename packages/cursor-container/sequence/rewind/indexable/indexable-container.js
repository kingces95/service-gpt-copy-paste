import { implement } from '@kingjs/implement'
import { RewindContainer } from '../rewind-container.js'
import { IndexableCursor } from './indexable-cursor.js'
import { Preconditions } from '@kingjs/debug-proxy'
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
  static [Preconditions] = class extends RewindContainer[Preconditions] {
    subtract$(index, otherCursor) {
      if (otherCursor.scope$ != this) throwNotEquatableTo()
    }
    move$(index, offset) {
      if (!this.isInBoundsOrEnd$(index, offset)) throwMoveOutOfBounds()
    }
    compareTo$(index, otherCursor) {
      if (otherCursor.scope$ != this) throwNotEquatableTo()
    }
    at$(index, offset) {
      if (!this.isInBounds$(index, offset)) throwReadOutOfBounds()
    }
    setAt$(index, offset, value) {
      if (!this.isInBounds$(index, offset)) throwWriteOutOfBounds()
    }

    shift() {
      super.shift()
      this.__bumpVersion$()
    }
    unshift(value) {
      this.__bumpVersion$()
    }
  }

  static get cursorType() { return IndexableCursor }

  constructor() {
    super()
  }

  static {
    implement(this, SequenceContainerConcept$, {
      equals$(index, otherCursor) { return index === otherCursor.index$ },
      step$(index) { return this.move$(index, 1) },
      value$(index) { return this.at$(index, 0) },
      setValue$(index, value) { this.setAt$(index, 0, value) },
    })
    implement(this, RewindContainerConcept$, {
      stepBack$(index) { return this.move$(index, -1) }
    })
    implement(this, IndexableContainerConcept$, {
      subtract$(index, otherCursor) { return index - otherCursor.index$ },
      move$(index, offset) { return index + offset },
      compareTo$(index, otherCursor) {
        if (index < otherCursor.index$) return -1
        if (index > otherCursor.index$) return 1
        return 0
      },
      // at$(index, offset) { },
      // setAt$(index, offset, value) { },
    })
    implement(this, SequenceContainerConcept, {
      get front() { return this.at$(0, 0) },
      // shift() { },
      // unshift(value) { },
    })
    implement(this, RewindContainerConcept, {
      get back() { return this.at$(this.count - 1, 0) },
      // get count() { },
      // pop() { },
      // push(value) { },
    })
    implement(this, IndexableContainerConcept, {
      at(index) { return this.at$(index, 0) },
      setAt(index, value) { this.setAt$(index, 0, value) },
    })
  }

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

  // cursor factory
  begin() { return this.cursor$(0) }
  end() { return this.cursor$(this.count) }
}
