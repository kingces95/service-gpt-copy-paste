import { implement } from '@kingjs/implement'
import { Range } from "./range.js"
import { Interval } from "./interval.js"
import { abstract } from '@kingjs/abstract'
import { extend } from '@kingjs/partial-extend'
import { Concept } from '@kingjs/concept'
import { Extends } from '@kingjs/partial-class'

export class IntervalConcept extends Concept {
  static [Extends] = {
    isEmpty() { return this.begin().equals(this.end()) },
    toRange() { return new Range(this.begin(), this.end()) },
  }

  get cursorType() { }
  
  begin() { }
  end() { }
}

export class CursorFactory extends Interval {
  #cursorType

  constructor() { 
    super()

    this.#cursorType = this.constructor.cursorType
  }
  
  cursor$(...args) {
    const type = this.#cursorType
    let cursor = new type(this, ...args)
    return cursor
  }
  
  // interval
  toRange() { return new Range(this.begin(), this.end()) }

  // cursor factory
  get isEmpty() { return this.begin().equals(this.end()) }
  static {
    extend(this, {
      begin: abstract,
      end: abstract,
    })
  }
}
