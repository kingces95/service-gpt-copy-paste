import { implement } from '@kingjs/partial-implement'
import { RangeConcept } from './range-concepts.js'
import { PartialProxy } from '@kingjs/partial-proxy'
import { Cursor } from './cursor.js'

export class Range extends PartialProxy {
  static cursorType = Cursor

  static { 
    implement(this, RangeConcept, { }, {
      begin() { },
      end() { },
    }) 
  }
}