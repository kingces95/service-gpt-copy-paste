import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { genericType } from '@kingjs/generic'
import { RangePart } from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { RangeOfRangesPartOf } from '../part/range-of-ranges-part.js'
import { CloneEmptyPart } from '../part/clone-empty-part.js'
import { SplitContainerPart } from '../part/split-container-part.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'
import { RangeOfRangesShapeOf } from '../shape/range-of-ranges-shape.js'

// ProjectedRangeContainer scans a source range as projected values while
// preserving source ownership. Cursors move in projected space, but popRange()
// returns the original source ranges that produced the committed prefix.
//
export const ProjectedRangeContainerOf = genericType(TSpan => {
  const RangeOfRangesPart = RangeOfRangesPartOf(TSpan)
  const RangeOfRangesShape = RangeOfRangesShapeOf(TSpan)

  return class ProjectedRangeContainer extends PartialProxy {
    static spanType = TSpan

    _source

    constructor(source) {
      super()
      assert(source instanceof RangeOfRangesShape,
        'Projected range source must be a range of ranges.')
      this._source = source
    }

    static {
      compose(this, RangePart, { }, {
        begin() { },
        end() { },
      })

      compose(this, TrimmedRangePart, { }, {
        get sourceEnd$() { },
      })

      compose(this, RangeOfRangesPart, {
        pushRange(range) {
          this.source$.pushRange(range)
          return this
        },

        popRange(cursor = this.end()) {
          return this.source$.popRange(cursor.sourceCursor$)
        },

        ranges() { return this.source$.ranges() },
      })

      compose(this, ProjectedRangePart, {
        get source$() { return this._source },
      }, {
        decodeToken$(sourceCursor, stride) { },
      })

      compose(this, CloneEmptyPart, {
        cloneEmpty() {
          return new this.constructor({
            source: this.source$.cloneEmpty(),
          })
        },
      })

      compose(this, SplitContainerPart, {
        split(cursor = this.end(), result = null) {
          const source = this.popRange(cursor)
          result ??= this.cloneEmpty()

          for (const range of iterate(source.ranges()))
            result.pushRange(range)

          return result
        },
      })
    }
  }
})

export const ProjectedRangeContainer = ProjectedRangeContainerOf(Object)
