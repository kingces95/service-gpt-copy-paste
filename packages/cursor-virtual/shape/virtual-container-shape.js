import { RangeShape } from '@kingjs/cursor-shape'

export class VirtualContainerShape extends RangeShape {
  static [Symbol.hasInstance](range) {
    if (!(range instanceof RangeShape))
      return false

    return typeof range.pushRange == 'function' &&
      typeof range.popRange == 'function' &&
      typeof range.ranges == 'function' &&
      typeof range.pages == 'function' &&
      typeof range.materialize == 'function'
  }

  pushRange(range) { }
  popRange(cursor) { }
  ranges() { }
  pages() { }
  materialize() { }
}
