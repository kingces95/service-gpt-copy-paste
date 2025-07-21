import { Interval } from "./interval.js"
import {
  throwNotEquatableTo,
} from '@kingjs/cursor'

export class Range extends Interval {
  #begin
  #end

  constructor(begin, end) {
    super()
    this.#begin = begin
    this.#end = end

    if (!begin.equatableTo(end)) throwNotEquatableTo()
  }

  toRange$() { return new Range(this.begin, this.end) }
  split$(cursor) {
    return [
      new Range(this.begin, cursor),
      new Range(cursor, this.end)
    ]
  }

  get isReadOnly() { return this.begin.isReadOnly }
  set isReadOnly(value) { 
    this.begin.isReadOnly = value
    this.end.isReadOnly = value 
  }

  get begin() { return this.#begin }
  get end() { return this.#end }

  data() { return this.begin.data(this.end) }

  mayContain(cursor) {
    return this.begin.equatableTo(cursor)
  }

  split(cursor) {
    if (!this.mayContain(cursor)) throwNotEquatableTo()
    return this.split$(cursor)
  } 

  equals(other) {
    if (!(other instanceof Range)) return false
    return this.begin.equatableTo(other.begin) &&
           this.end.equatableTo(other.end)
  }
}