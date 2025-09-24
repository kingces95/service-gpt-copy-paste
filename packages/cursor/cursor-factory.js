import { Range } from "./range.js"
import { Interval } from "./interval.js"
import { Member } from '@kingjs/reflection'
import { get } from '@kingjs/abstract'

const { define } = Member

export class CursorFactory extends Interval {  
  static {
    define(this, {
      cursorType: { get },
    })
  }

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
  begin() { return this.cursor$() }
  end() { return this.cursor$() }
}
