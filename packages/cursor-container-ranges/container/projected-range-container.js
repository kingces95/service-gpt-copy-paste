import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangePart } from '@kingjs/cursor'
import { ContainerPart } from '@kingjs/cursor-container'
import { iterate } from '@kingjs/cursor-algorithm'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { RangeBufferPart } from '../part/range-buffer-part.js'
import { CloneEmptyPart } from '../part/clone-empty-part.js'
import { SplitContainerPart } from '../part/split-container-part.js'
import { TrimmedRangePart } from '../part/trimmed-range-part.js'
import { RangeBufferShape } from '../shape/range-buffer-shape.js'

// ProjectedRangeContainer scans a source range as projected values while
// preserving source ownership. Cursors move in projected space, but popRange()
// returns the original source ranges that produced the committed prefix.
//
export class ProjectedRangeContainer extends PartialProxy {
  _source

  constructor(source) {
    super()
    assert(source instanceof RangeBufferShape,
      'Projected range source must be a range buffer.')
    this._source = source
  }

  static {
    compose(this, RangePart, { }, {
      begin() { },
      end() { },
    })

    compose(this, ContainerPart, {
      get isEmpty() { return this.begin().equals(this.end()) },
    })

    compose(this, TrimmedRangePart, { }, {
      get sourceEnd$() { },
    })

    compose(this, RangeBufferPart, {
      pushRange(range) {
        this.source$.pushRange(range)
        return this
      },

      popRange(cursor = this.end()) {
        return this.source$.popRange(cursor.sourceCursor$)
      },
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
