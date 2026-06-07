import { assert } from '@kingjs/assert'
import { define, defineAbstract } from '@kingjs/partial-define'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { iterate } from '@kingjs/cursor-algorithm'
import { RangeBufferPart } from '../part/range-buffer-part.js'
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

  decodeValue$(sourceCursor) {
    const cursor = sourceCursor.clone()
    const stride = this.decodeStride$(cursor)

    if (stride == null)
      return null

    return this.decodeToken$(cursor, stride)
  }

  static {
    defineAbstract(this, {
      decodeToken$(sourceCursor, stride) { },
    })
  }

  static {
    compose(this, RangeBufferPart, {
      pushRange(range) {
        this.source.pushRange(range)
        return this
      },

      popRange(cursor = this.end()) {
        return this.source.popRange(cursor.sourceCursor)
      },
    })

    define(this, {
      get source() { return this._source },
      get isEmpty() { return this.begin().equals(this.end()) },

      split(cursor = this.end()) {
        const source = this.popRange(cursor)
        const result = new this.constructor()

        for (const range of iterate(source.ranges()))
          result.pushRange(range)

        return result
      },
    })
  }
}
