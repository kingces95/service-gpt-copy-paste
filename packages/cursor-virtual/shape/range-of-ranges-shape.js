import { RangeShape } from '@kingjs/cursor-shape'
import { genericType } from '@kingjs/generic'

export const RangeOfRangesShapeOf = genericType(TSpan => {
  return class RangeOfRangesShape extends RangeShape {
    static spanType = TSpan

    static [Symbol.hasInstance](range) {
      if (!(range instanceof RangeShape))
        return false

      if (TSpan != Object && range.constructor.spanType != TSpan)
        return false

      return typeof range.pushRange == 'function' &&
        typeof range.popRange == 'function' &&
        typeof range.ranges == 'function' &&
        typeof range.spans == 'function'
    }

    pushRange(range) { }
    popRange(cursor) { }
    ranges() { }
    spans() { }
  }
})

export const RangeOfRangesShape = RangeOfRangesShapeOf(Object)
