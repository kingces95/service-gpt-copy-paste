import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { assert } from '@kingjs/assert'
import { spanTypeOfRange } from '@kingjs/cursor-shape'
import {
  RangeConcept,
} from '@kingjs/cursor'

export class SubrangeView extends PartialProxy {
  _first
  _last

  constructor(first, last) {
    super()
    this._first = first
    this._last = last
  }

  static {
    implement(this, RangeConcept, {
      get cursorType() {
        return this._first.constructor
      },
      begin() {
        return this._first.clone?.() ?? this._first
      },
      end() {
        return this._last.clone?.() ?? this._last
      },
    })
  }

  get spanType() { return this._first.spanType }

  span(begin = this.begin(), end = this.end()) {
    assert(typeof begin.span == 'function',
      'Subrange cursor must expose span().')
    const span = begin.span(end)
    const TSpan = spanTypeOfRange(this)

    assert(TSpan == null || TSpan == Object || span instanceof TSpan,
      'Subrange span type must match spanType.')
    return span
  }
}

export function subrange(first, last) {
  return new SubrangeView(first, last)
}
