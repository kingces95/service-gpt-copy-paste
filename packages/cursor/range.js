import { implement } from '@kingjs/implement'
import { RangeConcept } from './range-concepts.js'
import { PartialProxy } from '@kingjs/partial-proxy'
import { Cursor } from './cursor.js'

export class Range extends PartialProxy {
  static corsorType = Cursor

  static { 
    implement(this, RangeConcept, { }, {
      begin() { },
      end() { },
    }) 
  }
}