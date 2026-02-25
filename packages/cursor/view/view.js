import { PartialProxy } from '@kingjs/partial-proxy'
import { ForwardRangeConcept } from "../cursor-concepts.js"
import { implement } from '@kingjs/implement'

export class View extends PartialProxy {
  static {
    implement(this, ForwardRangeConcept, {
      // get cursorType() { return ViewCursor },
      // begin() { },
      // end() { },
    })
  }
}
