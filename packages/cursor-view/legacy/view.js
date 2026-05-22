import { PartialProxy } from '@kingjs/partial-proxy'
import { RangeConcept } from "@kingjs/cursor"
import { implement } from '@kingjs/partial-implement'

export class View extends PartialProxy {
  static {
    implement(this, RangeConcept, {
      // get cursorType() { return ViewCursor },
      // begin() { },
      // end() { },
    })
  }
}
