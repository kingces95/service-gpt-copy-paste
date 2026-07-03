import {
  Defines,
  DefinesAbstract,
  PartialClass,
} from '@kingjs/partial-class'
import { implement } from '@kingjs/partial-implement'
import { RangeConcept } from './range-concepts.js'

export class RangePart extends PartialClass {
  static [Defines] = {
    get cursorType() { return this.constructor.cursorType },
  }

  static [DefinesAbstract] = {
    begin() { },
    end() { },
  }

  static {
    implement(this, RangeConcept, { }, {
      begin() { },
      end() { },
    })
  }
}
