import { Buffer } from 'node:buffer'
import { assert } from '@kingjs/assert'
import { advance } from '@kingjs/cursor-algorithm'

export class Page {
  _container
  _outerCursor
  _range

  constructor(range) {
    this._range = range
  }

  get range() { return this._range }

  _attach(container, outerCursor) {
    this._container = container
    this._outerCursor = outerCursor.clone()
    return this
  }

  begin() { return this._virtualizeCursor(this._range.begin()) }
  end() { return this._virtualizeCursor(this._range.end()) }

  _virtualizeCursor(pageCursor) {
    assert(this._container,
      'Page must have a virtual container to virtualize cursors.')
    assert(this._outerCursor,
      'Page must have an outer cursor to virtualize cursors.')

    return new this._container.cursorType(
      this._container,
      this._outerCursor.clone(),
      pageCursor.clone(),
      this._range.end()
    )
  }

  _virtualizeMatch(match) {
    if (!this._container)
      return match

    return {
      begin: this._virtualizeCursor(match.begin),
      end: this._virtualizeCursor(match.end),
    }
  }

  findSequence(needle) {
    assert(needle instanceof Uint8Array,
      'Page sequence search requires a Uint8Array needle.')

    const span = this._range.begin().span(this._range.end())
    const index = Buffer
      .from(span.buffer, span.byteOffset, span.byteLength)
      .indexOf(needle)

    if (index < 0)
      return null

    return this._virtualizeMatch({
      begin: advance(this._range.begin(), index),
      end: advance(this._range.begin(), index + needle.length),
    })
  }
}
