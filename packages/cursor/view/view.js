import { PartialProxy } from '@kingjs/partial-proxy'
import { CursorFactoryConcept } from "../cursor-concepts.js"
import { implement } from '@kingjs/implement'

export class View extends PartialProxy {
  static {
    implement(this, CursorFactoryConcept, {
      // get cursorType() { return ViewCursor },
      // begin() { },
      // end() { },
    })
  }
}
