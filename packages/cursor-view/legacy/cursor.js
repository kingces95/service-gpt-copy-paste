import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { 
  CursorConcept 
} from '@kingjs/cursor'

export class Cursor extends PartialProxy { 
  _range

  constructor(range) {
    super()
    assert(range)
    this._range = range
  }

  static {
    implement(this, CursorConcept, { 
      get range() { return this._range }
    }, {
      step() { return this }
    })
  }
}
