import { assert } from '@kingjs/assert'
import { contract } from '@kingjs/function-contract'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangePart } from '@kingjs/cursor'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { RangeContainerPart } from '../part/range-container-part.js'
import { SplittableRangePart } from '../part/splittable-range-part.js'
import { SplittableRangeShape } from '../shape/ranges-container-shape.js'
import { ProjectedCursor } from '../cursor/projected-cursor.js'
import { Projector } from '../projector/projector.js'

// ProjectedRangeContainer scans a source range as projected values while
// preserving source ownership. Cursors move in projected space, but
// popRangeAt() returns the source ranges that produced the committed prefix.
//
export class ProjectedRangeContainer extends PartialProxy {
  static cursorType = ProjectedCursor

  _source
  _projector

  constructor(source) {
    super()
    assert(source instanceof SplittableRangeShape,
      'Virtual source must be a splittable range container.')
    this._source = source
    this._projector = new Projector(this)
  }

  static {
    compose(this, RangePart, {
      begin() { return new this.cursorType(this, this.source$.begin()) },
      end() { return new this.cursorType(this, this.source$.end()) },
    })

    compose(this, RangeContainerPart, {
      pushRange(range) {
        this.source$.pushRange(range)
        return this
      },

      popRangeAt(cursor = this.end()) {
        return this.source$.popRangeAt(cursor.sourceCursor$)
      },

      popRange: contract({
        precondition(sequence) {
          assert(sequence instanceof this.constructor,
            'Projected sequence must match projected range.')
        },
      },
      function popRange(sequence, options) {
        const sourceNeedle = sequence.materialize()
        return this.source$.popRange(sourceNeedle, options)
      }),

      ranges() { return this.source$.ranges() },
    })

    compose(this, SplittableRangePart)

    compose(this, ProjectedRangePart, {
      get source$() { return this._source },
      get projector$() { return this._projector },
      get source() { return this._source },
      get projector() { return this._projector },
    }, {
      decodeToken$(sourceCursor, stride) { },
    })
  }
}
