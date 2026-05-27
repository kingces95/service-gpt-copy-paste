import { implement } from '@kingjs/partial-implement'
import { extend } from '@kingjs/partial-extend'
import {
  CursorPart,
  ReadableCursorPart,
  SteppableCursorPart,
} from '@kingjs/cursor'
import {
  EquatableConcept
} from '@kingjs/partial-concept'
import { ContainerCursor } from './container-cursor.js'

// ____________________________________________________________________________
// ITERATOR CURSOR

// IteratorCursor is used by associative containers to enumerate values
// returned by an underlying Map/Set iterator or iterator-like generator.
//
// MapCursor layers an internal key$ accessor over that value by reading
// value[0].

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
  _current

  constructor(range, iterable) {
    super(range, iterable[Symbol.iterator]())
    this._current = this.token.next()
  }

  get done$() { return this._current.done }
  get key$() { return this.value }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        const { done$ } = this
        const { done$: otherDone } = other
        if (done$ && otherDone) return true
        if (done$ != otherDone) return false

        const { key$ } = this
        const { key$: otherKey } = other
        return key$ === otherKey
      }
    })

  }

  static {
    extend(this, CursorPart, {
      get isAtEnd$() { return this.done$ },
    })

    extend(this, SteppableCursorPart, {
      step() {
        this._current = this.token.next()
        return this
      },
    })

    extend(this, ReadableCursorPart, {
      get value() { return this._current.value },
    })
  }
}
