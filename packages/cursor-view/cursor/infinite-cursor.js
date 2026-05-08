import { implement } from '@kingjs/partial-implement'
import { 
  Cursor,
  InputCursorConcept, 
} from "@kingjs/cursor"
import { Precondition } from '@kingjs/partial-symbols'

export class InfiniteCursor extends Cursor {
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

  constructor(range, isEnd) {
    super(range)

    this.#isEnd = false
  }

  get isEnd() { return this.#isEnd }

  static {
    implement(this, InputCursorConcept, {
      step() { },
      equals(other) { return other == this },
    }, {
      get value() { }
    })
  }
}
