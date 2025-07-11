import { Interval } from "../interval.js"

export class Range extends Interval {
  #begin
  #end

  constructor(begin, end) {
    super()
    this.#begin = begin
    this.#end = end

    if (!begin.equatableTo(end)) this.throwNotEquatableTo$()
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
  get isForward() { return this.begin.isForward }
  get isBidirectional() { return this.begin.isBidirectional }
  get isRandomAccess() { return this.begin.isRandomAccess }
  get isContiguous() { return this.begin.isContiguous }

  get begin() { return this.#begin }
  get end() { return this.#end }

  data() { return this.begin.data(this.end) }

  mayContain(cursor) {
    return this.begin.equatableTo(cursor)
  }

  split(cursor) {
    if (!this.mayContain(cursor)) cursor.throwNotEquatableTo$()
    return this.split$(cursor)
  } 

  equals(other) {
    if (!(other instanceof Range)) return false
    return this.begin.equatableTo(other.begin) &&
           this.end.equatableTo(other.end)
  }
}