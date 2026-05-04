import { implement } from '@kingjs/partial-implement'
import { define } from '@kingjs/partial-define'
import { Preconditions } from '@kingjs/partial-symbols'
import { 
  CursorConcept,
  InputCursorConcept,
} from '@kingjs/cursor'
import { 
  EquatableConcept 
} from '@kingjs/partial-concept'
import { ContainerCursor } from './container-cursor.js'

// ____________________________________________________________________________
// ITERATOR CURSOR

// IteratorCursor is an InputCursorConcept over an iterator. 

// IteratorCursor yields a value which contains a key.

// IteratorCursor's identity is a combination of

//    1. its very type
//    2. its container (i.e. Map or Set)
//    3. its 'position' which is determined by the key it is currently on.

// This last component of identity necessitates that IteratorCursor know what 
// key its currently on which necessitates that on creation, MapCursor must
// immediately begin iteration over the Map to get the first key. This could
// be deferred until the first call to equals, but that would be a very odd
// behavior and would make debugging difficult.

export class IteratorCursor extends ContainerCursor {
  static [Preconditions] = {
    get key() { 
      if (this._current.done) throw new Error(
        'Cursor is at end of container')
    },
  }

  _current

  constructor(range, iterable) {
    super(range, iterable[Symbol.iterator]())
    this._current = this.token.next()
  }

  get done() { return this._current.done }

  static {
    define(this, { 
      get key() { return this.value },
    })

    implement(this, EquatableConcept, { 
      equals(other) { 
        if (!this.equatableTo(other)) return false
        const { done } = this
        const { done: otherDone } = other
        if (done && otherDone) return true
        if (done != otherDone) return false

        const { key } = this
        const { key: otherKey } = other
        return key === otherKey
      }
    })

    implement(this, CursorConcept, { 
      step() { this._current = this.token.next() },
    })

    implement(this, InputCursorConcept, { 
      get value() { return this._current.value },
    })
  }
}
