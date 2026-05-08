import { implement } from '@kingjs/partial-implement'
import { 
  Range,
  InputRangeConcept,
  InputCursorConcept, 
} from "@kingjs/cursor"
import { InfiniteCursor } from "./cursor/infinite-cursor.js"

class RepeatCursor extends InfiniteCursor {
  constructor(range, isEnd) {
    super(range, isEnd)
  }

  static {
    implement(this, InputCursorConcept, {
      value() { return this.range._value },
    })
  }
}

export class RepeatView extends Range {
  static cursorType = RepeatCursor

  _value

  constructor(value) {
    super()
    this._value = value
  }
  
  static {
    implement(this, InputRangeConcept, {
      begin() { return new RepeatCursor(this) },
      end() { return new RepeatCursor(this, true) },
    })
  }
}
