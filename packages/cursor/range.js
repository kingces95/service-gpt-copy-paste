import { implement } from '@kingjs/implement'
import { Concept } from '@kingjs/concept'
import { throwNotEquatableTo } from './throw.js'

export class IntervalConcept extends Concept {
  toRange() { }
}

export class Range {
  #begin
  #end

  constructor(begin, end) {
    this.#begin = begin
    this.#end = end

    if (!begin.equatableTo(end)) throwNotEquatableTo()
  }

  static {
    implement(this, IntervalConcept, {
      toRange() { return this }
    })
  }

  get begin() { return this.#begin }
  get end() { return this.#end }

  data() { return this.begin.data(this.end) }
  mayContain(cursor) { return this.begin.equatableTo(cursor) }
  split(cursor) {
    if (!this.mayContain(cursor)) throwNotEquatableTo()
    return [
      new Range(this.begin, cursor),
      new Range(cursor, this.end)
    ]
  } 
  equals(other) {
    if (!(other instanceof Range)) return false
    if (!this.begin.equals(other.begin)) return false
    if (!this.end.equals(other.end)) return false
    return true
  }
}