import { implement } from '@kingjs/implement'
import { 
  Cursor,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from '@kingjs/cursor'
import { Container } from './container.js'
import { 
  SequenceContainerConcept$,
  RewindContainerConcept$,
  IndexableContainerConcept$,
  ContiguousContainerConcept$,

  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  ContiguousContainerConcept,
  ContainerConcept$,
} from './container-concepts.js'

export class SingletonSequenceCursor extends Cursor {
  static {
    implement(this, ForwardCursorConcept)
  }
}
export class SingletonRewindCursor extends SingletonSequenceCursor {
  static {
    implement(this, BidirectionalCursorConcept)
  }
}
export class SingletonIndexableCursor extends SingletonRewindCursor {
  static {
    implement(this, RandomAccessCursorConcept)
  }
}
export class SingletonContiguousCursor extends SingletonIndexableCursor {
  static {
    implement(this, ContiguousCursorConcept)
  }
}

export class SingletonContainer extends Container {
  constructor(singleton) {
    super()
    this._singleton = singleton
  }

  get singleton$() { return this._singleton }
  set singleton$(value) { this._singleton = value }
}
export class SingletonSequenceContainer extends SingletonContainer {
  static cursorType = SingletonSequenceCursor

  static {
    implement(this, SequenceContainerConcept$, {

    })

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
export class SingletonRewindContainer extends SingletonContainer {
  static cursorType = SingletonRewindCursor

  static {
    implement(this, RewindContainerConcept$, { })
    implement(this, RewindContainerConcept, { })
  }
}
export class SingletonIndexableContainer extends SingletonContainer {
  static cursorType = SingletonIndexableCursor

  static {
    implement(this, IndexableContainerConcept$, { })
    implement(this, IndexableContainerConcept, { })
  }
}
export class SingletonContiguousContainer extends SingletonContainer {
  static cursorType = SingletonContiguousCursor

  static {
    implement(this, ContiguousContainerConcept$, { })
    implement(this, ContiguousContainerConcept, { })
  }
}