export class Range {
  static isRange(range) {
    if (range instanceof Range) return true
    if (range === null || range === undefined) return false
    const hasBegin = 'begin' in range
    const hasEnd = 'end' in range
    return hasBegin && hasEnd
  }
  static from(range) {
    if (range instanceof Range) return range
    if (!Range.isRange(range)) throw new TypeError('Invalid range object')
    return new Range(range.begin, range.end)
  }

  #begin
  #end

  constructor(begin, end) {
    this.#begin = begin
    this.#end = end
    if (!begin.equatable(end)) throw new TypeError(
      "Begin and end must be equatable.")
  }

  get isReadOnly() { return this.begin.isReadOnly }
  get isForward() { return this.begin.isForward }
  get isBidirectional() { return this.begin.isBidirectional }
  get isIterable() { return this.begin.isIterable }
  get isRandomAccess() { return this.begin.isRandomAccess }
  get isContiguous() { return this.begin.isContiguous }

  get begin() { return this.#begin }
  get end() { return this.#end }

  data() { return this.begin.data(this.end) }

  split(cursor) {
    return [
      new Range(this.begin, cursor),
      new Range(cursor, this.end)
    ]
  } 
}