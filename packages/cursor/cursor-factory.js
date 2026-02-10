import { Range } from "./range.js"
import { Interval } from "./interval.js"
import { abstract } from '@kingjs/abstract'
import { extend } from '@kingjs/partial-extend'
import { Concept } from '@kingjs/concept'
import { Extends } from '@kingjs/partial-class'

export class CursorFactoryConcept extends Concept {
  static [Extends] = {
    isEmpty() { return this.begin().equals(this.end()) },
    toRange() { return new Range(this.begin(), this.end()) },
  }

  get cursorType() { }
  
  begin() { }
  end() { }
}
