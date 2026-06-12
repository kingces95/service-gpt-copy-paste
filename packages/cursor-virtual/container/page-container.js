import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from '@kingjs/cursor'
import { PageCursor } from '../cursor/page-cursor.js'

export class PageContainer extends PartialProxy {
  static cursorType = PageCursor

  _range
  _virtualizeOffset

  constructor(range, { virtualizeOffset = () => null } = { }) {
    super()
    this._range = range
    this._virtualizeOffset = virtualizeOffset
  }

  virtualizeOffset(offset) {
    return this._virtualizeOffset(offset)
  }

  cursorAt(offset) {
    const cursor = this.begin()

    for (let i = 0; i < offset; i++)
      cursor.step()

    return cursor
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
