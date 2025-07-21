import { JoinViewCursor } from '@kingjs/cursor'

class SegmentCursor extends JoinViewCursor {
  constructor(view, outterCursor, innerCursor = null) {
    super(view, outterCursor, innerCursor)
  }
}
