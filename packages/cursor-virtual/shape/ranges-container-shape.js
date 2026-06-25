import { RangeShape } from '@kingjs/cursor-shape'

export class RangesContainerShape extends RangeShape {
  pushRange(range) { }
  popRangeAt(cursor) { }
  popRange(needle, options) { }
  ranges() { }
  spans() { }
  materialize() { }
}

export class SplittableRangeShape extends RangesContainerShape {
  splitAt(cursor) { }
  split(needle, options) { }
}
