import { implement } from '@kingjs/partial-implement'
import {
  Range,
  RangeConcept,
} from '@kingjs/cursor'

export class SubrangeView extends Range {
  _first
  _last

  constructor(first, last) {
    super()
    this._first = first
    this._last = last
  }

  static {
    implement(this, RangeConcept, {
      get prototypeCursor() {
        return this._first
      },
      begin() {
        return this._first.clone?.() ?? this._first
      },
      end() {
        return this._last.clone?.() ?? this._last
      },
    })
  }
}

export function subrange(first, last) {
  return new SubrangeView(first, last)
}
