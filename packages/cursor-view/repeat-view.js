import { implement } from '@kingjs/partial-implement'
import { PartialProxy } from '@kingjs/partial-proxy'
import { 
  RangeConcept,
  ReadableCursorConcept,
} from "@kingjs/cursor"
import { InfiniteCursor } from "./cursor/infinite-cursor.js"

class RepeatCursor extends InfiniteCursor {
  constructor(range, isEnd) {
    super(range, isEnd)
  }

  static {
    implement(this, ReadableCursorConcept, {
      get value() { return this.view._value },
    })
  }
}

export class RepeatView extends PartialProxy {
  static cursorType = RepeatCursor

  _value

  constructor(value) {
    super()
    this._value = value
  }
  
  static {
    implement(this, RangeConcept, {
      begin() { return new RepeatCursor(this) },
      end() { return new RepeatCursor(this, true) },
    })
  }
}
