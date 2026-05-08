import { PartialProxy } from '@kingjs/partial-proxy'
import { ForwardRangeConcept } from "@kingjs/cursor"
import { implement } from '@kingjs/partial-implement'

export class View extends PartialProxy {
  static {
    implement(this, ForwardRangeConcept, { }, {
      // get cursorType() { return ViewCursor },
      // begin() { },
      // end() { },
    })
  }
}
