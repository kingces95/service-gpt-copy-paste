import { JoinViewCursor } from '../../view/join-view-cursor.js'
import { Range } from '../../view/range.js'
import { View } from '../../view/view.js'
import { find } from '../../algorithm/find.js'
import { Vector } from '../sequence/rewind/indexable/vector.js'
import { Deque } from '../sequence/rewind/indexable/deque.js'

class SegmentCursor extends JoinViewCursor {
  constructor(view, outterCursor, innerCursor = null) {
    super(view, outterCursor, innerCursor)
  }
}
