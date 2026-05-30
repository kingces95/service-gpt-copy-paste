import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  ReadableCursorConcept,
  SteppableCursorConcept,
} from '@kingjs/cursor'
import { Precondition } from '@kingjs/partial-symbols'
import { ViewCursor } from './view-cursor.js'

export class InfiniteCursor extends ViewCursor {
  static [Precondition] = {
    step() {
      if (this.isEnd) throw new Error(
        'Cannot step infinite cursor sentinel.') 
    },
    get value() {
      if (this.isEnd) throw new Error(
        'Cannot read infinite cursor sentinel.')
    }
  }

  #isEnd

  constructor(view, isEnd) {
    super(view)

    this.#isEnd = false
  }

  get isEnd() { return this.#isEnd }

  static {
    implement(this, EquatableConcept, {
      equals(other) { return other == this },
    })

    implement(this, SteppableCursorConcept, {
      step() { },
    })

    implement(this, ReadableCursorConcept, {
      get value() { }
    })
  }
}
