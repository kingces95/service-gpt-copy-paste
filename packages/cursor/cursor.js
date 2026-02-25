import { assert } from '@kingjs/assert'
import { implement } from '@kingjs/implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { 
  CursorConcept 
} from './cursor-concepts.js'

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
      step() { }
    })
  }
}

