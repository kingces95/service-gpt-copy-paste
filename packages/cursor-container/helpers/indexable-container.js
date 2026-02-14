import { implement } from '@kingjs/implement'
import { extend } from '@kingjs/partial-extend'
import { SequenceContainer } from '../helpers/sequence-container.js'
import { RewindContainer } from '../helpers/rewind-container.js'
import { Preconditions, TypePrecondition } from '@kingjs/partial-proxy'
import {
  throwStale,
  throwNotEquatableTo,
  throwWriteOutOfBounds,
  throwMoveOutOfBounds,
  throwReadOutOfBounds,
  RandomAccessCursorConcept,
} from '@kingjs/cursor'
import {
  ContainerCursorConcept,
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
} from '../container-concepts.js'

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

  static cursorType = class IndexableCursor 
    extends RewindContainer.cursorType {

    static api$ = class IndexableContainerConcept$ 
      extends RewindContainer.cursorType.api$ {
        
      at$(cursor, offset) { }
      setAt$(cursor, offset, value) { }
      subtract$(cursor, otherCursor) { }
      move$(cursor, offset) { }
      compareTo$(cursor, otherCursor) { }
    }

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
    implement(this, {
      at$$() { },
      setAt$$() { },
    })
  }

  static {
    implement(this, SequenceContainer.cursorType.api$, {
      equals$({ index$: index}, { index$: otherIndex }) { 
        return index === otherIndex },
      step$(cursor) { return this.move$(cursor, 1) },
      value$({ index$: index}) { return this.at$$(index, 0) },
      setValue$({ token$: index }, value) { this.setAt$$(index, 0, value) },
    })

    implement(this, RewindContainer.cursorType.api$, {
      stepBack$(cursor) { return this.move$(cursor, -1) }
    })

    implement(this, IndexableContainer.cursorType.api$, {
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
  }

  static {
    extend(this, {
      isBegin(cursor) { 
        return cursor.index$ === 0
      },
      isEnd(cursor) { 
        return cursor.index$ === this.count
      },
    })
  }

  static {
    extend(this, {
      beginToken$() { return 0 },
      endToken$() { return this.count },
    })

    implement(this, SequenceContainerConcept, {
      get front() { return this.at$$(0, 0) },
      // shift() { },
      // unshift(value) { },
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
}
