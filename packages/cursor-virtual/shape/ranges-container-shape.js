import { RangeShape } from '@kingjs/cursor-shape'

export class RangesContainerShape extends RangeShape {
  pushRange(range) { }
  popRangeAt(cursor) { }
  popRange(sequence, options) { }
  ranges() { }
  materialize() { }
}

export class SplittableRangeShape extends RangesContainerShape {
  splitAt(cursor) { }
  split(sequence, options) { }
}
