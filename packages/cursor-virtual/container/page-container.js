import { distance } from '@kingjs/cursor-algorithm'
import { subrange } from '@kingjs/cursor-view'

export class Page {
  _offset
  _range
  _virtualize

  constructor(range, {
    offset = 0,
    virtualize = null,
  } = { }) {
    this._offset = offset
    this._range = range
    this._virtualize = virtualize
  }

  get offset() { return this._offset }
  get range() { return this._range }
  get cursorType() { return this._range.cursorType }

  begin() { return this._range.begin() }
  end() { return this._range.end() }

  span(begin = this.begin(), end = this.end()) {
    return begin.span(end)
  }

  offsetOf(cursor) {
    return distance(subrange(this.begin(), cursor))
  }

  virtualize(cursor) {
    return this._virtualize?.(cursor) ?? null
  }
}

export { Page as PageContainer }
