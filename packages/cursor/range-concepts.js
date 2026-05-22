import { Concept } from '@kingjs/partial-concept'
import { Defines } from '@kingjs/partial-class'

export class RangeConcept extends Concept {
  static [Defines] = {
    get cursorType() { return this.constructor.cursorType },
  }

  get cursorType() { }
  begin() { }
  end() { }
}
