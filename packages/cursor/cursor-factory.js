import { Range } from "./range.js"
import { Interval } from "./interval.js"
import { abstract } from '@kingjs/abstract'
import { extend } from '@kingjs/partial-extend'

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
