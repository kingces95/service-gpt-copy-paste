import { implement } from '@kingjs/implement'
import { SequenceContainer } from '../helpers/sequence-container.js'
import { RewindContainer } from '../helpers/rewind-container.js'
import { IndexableContainer } from '../helpers/indexable-container.js'
import { ContiguousContainer } from '../helpers/contiguous-container.js'
import { SequenceCursor } from '../helpers/sequence-cursor.js'
import { RewindCursor } from '../helpers/rewind-cursor.js'
import { IndexableCursor } from '../helpers/indexable-cursor.js'
import { ContiguousCursor } from '../helpers/contiguous-cursor.js'
import { Container } from '../helpers/container.js'

import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  ContiguousContainerConcept,
} from '../container-concepts.js'

export class SingletonContainer extends Container {
  constructor(singleton) {
    super()
    this._singleton = singleton
  }

  get singleton$() { return this._singleton }
  set singleton$(value) { this._singleton = value }
}
export class SequenceSingletonContainer extends SingletonContainer {
  static cursorType = SequenceCursor

  static {
    implement(this, SequenceContainer.cursorType.api$, {
      equals$: (cursor, other) => cursor.value$ === other.value$,
      step$(cursor) { },
      value$(cursor) { },
      setValue$(cursor, value) { },
    })
  }

  static {
    implement(this, SequenceContainerConcept, {
      get front() { return this.singleton$ },
      unshift(value) { this.singleton$ = value },
      shift() { 
        const value = this.singleton$
        this.singleton$ = undefined
        return value
      },
    })
  }
}
export class RewindSingletonContainer extends SingletonContainer {
  static cursorType = RewindCursor

  static {
    implement(this, RewindContainer.cursorType.api$, { 
      stepBack$(cursor) { } 
    })
  }

  static {
    implement(this, RewindContainerConcept, { 
      // get count() { },
      // get back() { },
      // pop() { },
      // push(value) { },      
    })
  }
}
export class IndexableSingletonContainer extends SingletonContainer {
  static cursorType = IndexableCursor

  static {
    implement(this, IndexableContainer.cursorType.api$, { 
      at$(cursor, offset) { },
      setAt$(cursor, offset, value) { },
      subtract$(cursor, otherCursor) { },
      move$(cursor, offset) { },
      compareTo$(cursor, otherCursor) { },
    })
  }

  static {
    implement(this, IndexableContainerConcept, { 
      // at(index) { },
      // setAt(index, value) { },
    })
  }
}
export class ContiguousSingletonContainer extends SingletonContainer {
  static cursorType = ContiguousCursor

  static {
    implement(this, ContiguousContainer.cursorType.api$, { 
      readAt$(cursor, offset, length, signed, littleEndian) { }
    })
  }

  static {
    implement(this, ContiguousContainerConcept, { 
      // readAt( offset, length, signed, littleEndian) { }
    })
  }
}