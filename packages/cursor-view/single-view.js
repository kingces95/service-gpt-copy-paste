import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  Cursor,
  Range,
  ForwardCursorConcept,
  ForwardRangeConcept,
} from '@kingjs/cursor'
import { Precondition } from '@kingjs/partial-symbols'

class SingleCursor extends Cursor {
  static [Precondition] = {
    step() { 
      if (this.isEnd) throw new Error(
        'Cannot step single cursor past end.') 
    },
    get value() {
      if (this.isEnd) throw new Error(
        'Cannot read single cursor past end.')
    }
  }

  _isEnd

  constructor(range, isEnd = false) {
    super(range)

    this._isEnd = isEnd
  }

  get isEnd() { return this._isEnd }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.isEnd == other.isEnd
      },
    })

    implement(this, ForwardCursorConcept, {
      get value() { return this.range._value },
      step() {
        this._isEnd = true
        return this
      },
      clone() {
        return new this.constructor(this.range, this.isEnd)
      },
    })
  }
}

export class SingleView extends Range {
  static cursorType = SingleCursor

  _value

  constructor(value) {
    super()
    this._value = value
  }

  get value() { return this._value }

  static {
    implement(this, ForwardRangeConcept, {
      begin() { return new this.cursorType(this) },
      end() { return new this.cursorType(this, true) },
    })
  }
}
