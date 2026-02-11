import { implement } from '@kingjs/implement'
import { SequenceCursor } from '../cursor/sequence-cursor.js'
import { RewindCursor } from '../cursor/rewind-cursor.js'
import { IndexableCursor } from '../cursor/indexable-cursor.js'
import { ContiguousCursor } from '../cursor/contiguous-cursor.js'
import { Container } from './container.js'
import { 
  SequenceContainerConcept$,
  RewindContainerConcept$,
  IndexableContainerConcept$,
  ContiguousContainerConcept$,
} from '../cursor/container-cursor-api.js'
import {
  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  ContiguousContainerConcept,
} from './container-concepts.js'

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
    implement(this, SequenceContainerConcept$, {
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
    implement(this, RewindContainerConcept$, { 
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
    implement(this, IndexableContainerConcept$, { 
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
    implement(this, ContiguousContainerConcept$, { 
      readAt$(cursor, offset, length, signed, littleEndian) { }
    })
  }

  static {
    implement(this, ContiguousContainerConcept, { 
      // readAt( offset, length, signed, littleEndian) { }
    })
  }
}