import { Interval } from "../interval.js"
import { CursorFactoryConcept } from "../cursor-concepts.js"
import { implement } from '@kingjs/implement'

export class View extends Interval {
  static {
    implement(this, CursorFactoryConcept, {
      // get cursorType() { return ViewCursor },
      // begin() { },
      // end() { },
    })
  }
}
