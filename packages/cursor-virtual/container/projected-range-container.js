import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangePart } from '@kingjs/cursor'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { RangeContainerPart } from '../part/range-container-part.js'
import { SplittableRangeShape } from '../shape/ranges-container-shape.js'
import { ProjectedCursor } from '../cursor/projected-cursor.js'

// ProjectedRangeContainer scans a source range as projected values while
// preserving source ownership. Cursors move in projected space, but
// popRangeAt() returns the source ranges that produced the committed prefix.
//
export class ProjectedRangeContainer extends PartialProxy {
  static cursorType = ProjectedCursor

  _source

  constructor(source) {
    super()
    assert(source instanceof SplittableRangeShape,
      'Virtual source must be a splittable range container.')
    this._source = source
  }

  static {
    compose(this, RangePart, {
      begin() { return new this.cursorType(this, this.source$.begin()) },
      end() {
        return new this.cursorType(this, this.trimEnd$(this.source$.end()))
      },
    })

    compose(this, ProjectedRangePart, {
      get source$() { return this._source },

      stepValue$(sourceCursor) {
        sourceCursor.step()
      },

      stepBackValue$(sourceCursor) {
        sourceCursor.stepBack()
      },

      trimEnd$(sourceCursor) {
        return sourceCursor
      },
    }, {
      decodeValue$(sourceCursor) { },
    })

    compose(this, RangeContainerPart, {
      get bytesPopped() { return this.source$.bytesPopped },
      get bytesPushed() { return this.source$.bytesPushed },

      pushRange(range) {
        this.source$.pushRange(range)
        return this
      },

      popRangeAt(cursor = this.end()) {
        return this.source$.popRangeAt(cursor.sourceCursor$)
      },

      popRange$(needle, options) {
        assert(needle,
          'Projected needle must match projected range.')

        return this.source$.popRange(needle, options)
      },

      ranges() { return this.source$.ranges() },
    })
  }
}
