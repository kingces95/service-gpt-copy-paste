import { DebugProxy } from '@kingjs/debug-proxy'
import { extend } from '@kingjs/partial-extend'
import { abstract } from '@kingjs/abstract'

// Interval is the base class for Container, View, and Range. Strictly
// speaking, Container and View both extend CursorFactory, but that
// is an implementation detail.

// Interval was motivated by the need of SegmentContainer to intern
// segments of data which can be represented as a Container, View, or
// Range. Interval allows any of those abstractions to be easily converted
// to a Range which can then be stored internally by the SegmentContainer.

export class Interval extends DebugProxy {  
  static {
    extend(this, { toRange: abstract })
  }
}
