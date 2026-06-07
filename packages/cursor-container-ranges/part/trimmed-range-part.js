import { RangeConcept } from '@kingjs/cursor'
import { DefinesAbstract } from '@kingjs/partial-class'
import { PartialClass } from '@kingjs/partial-class'
import { implement } from '@kingjs/partial-implement'

export class TrimmedRangePart extends PartialClass {
  static [DefinesAbstract] = {
    get sourceEnd$() { },
  }

  static {
    implement(this, RangeConcept, {
      begin() { return new this.cursorType(this, this.source.begin()) },
      end() { return new this.cursorType(this, this.sourceEnd$, null) },
    })
  }
}
