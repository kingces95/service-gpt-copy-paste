import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from '@kingjs/cursor'
import { spanTypeOfRange } from '@kingjs/cursor-shape'
import { PageCursor } from '../cursor/page-cursor.js'

export class PageContainer extends PartialProxy {
  static cursorType = PageCursor

  _range

  constructor(range) {
    super()
    this._range = range
  }

  get spanType() {
    return spanTypeOfRange(this._range)
  }

  span(begin = this.begin(), end = this.end()) {
    return begin.span(end)
  }

  static {
    implement(this, RangeConcept, {
      begin() {
        return new this.cursorType(this, this._range.begin())
      },

      end() {
        return new this.cursorType(this, this._range.end())
      },
    })
  }
}
