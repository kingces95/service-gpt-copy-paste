import { extend } from '@kingjs/partial-extend'
import { abstract } from '@kingjs/abstract'
import { PartialProxy } from '@kingjs/partial-proxy'

// Interval is the base class for Container, View, and Range. 

// Interval was motivated by the need of SegmentContainer to intern
// segments of data which can be represented as a Container, View, or
// Range. Interval allows any of those abstractions to be easily converted
// to a Range which can then be stored internally by the SegmentContainer.

export class Interval extends PartialProxy {  
  static {
    extend(this, { toRange: abstract })
  }
}
