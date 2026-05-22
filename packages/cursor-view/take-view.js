import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import { 
  RangeConcept,
  ReadableCursorConcept,
  SteppableCursorConcept,
} from "@kingjs/cursor"
import { Precondition } from '@kingjs/partial-symbols'
import { AdapterView } from "./adapter-view.js"
import { ViewCursor } from './cursor/view-cursor.js'

class TakeCursor extends ViewCursor {
  static [Precondition] = {
    step() {
      if (this._remaining <= 0) throw new Error(
        'Cannot step take cursor past end.') 
    },
    get value() {
      if (this._remaining <= 0) throw new Error(
        'Cannot read take cursor past end.')
    }
  }

  _cursor
  _remaining

  constructor(view, cursor, _remaining) {
    super(view)

    this._cursor = cursor
    this._remaining = _remaining
  }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this._remaining == other._remaining
      },
    })

    implement(this, SteppableCursorConcept, {
      step() { 
        this._remaining--
        this._cursor.step()
        return this
      },
    })

    implement(this, ReadableCursorConcept, {
      get value() { return this._cursor.value },
    })
  }
}

export class TakeView extends AdapterView {
  static cursorType = TakeCursor

  _count

  constructor(range, value) {
    super(range)
    this._count = value
  }
  
  static {
    implement(this, RangeConcept, {
      begin() {
        const begin = this.range.begin() 
        return new this.cursorType(this, begin, this._count) 
      },
      end() { 
        const end = this.range.end()
        return new this.cursorType(this, end, 0) 
      },
    })
  }
}
