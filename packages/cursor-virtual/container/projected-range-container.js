import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { RangePart } from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import { ProjectedRangePart } from '../part/projected-range-part.js'
import { VirtualContainerPart } from '../part/virtual-container-part.js'
import { CloneEmptyPart } from '../part/clone-empty-part.js'
import { SplitContainerPart } from '../part/split-container-part.js'
import { VirtualContainerShape } from '../shape/virtual-container-shape.js'
import { ProjectedCursor } from '../cursor/projected-cursor.js'
import { Projector } from '../projector/projector.js'

// ProjectedRangeContainer scans a source range as projected values while
// preserving source ownership. Cursors move in projected space, but popRange()
// returns the source ranges that produced the committed prefix.
//
export class ProjectedRangeContainer extends PartialProxy {
  static cursorType = ProjectedCursor

  _source
  _projector

  constructor(source) {
    super()
    assert(source instanceof VirtualContainerShape,
      'Virtual source must be a range of ranges.')
    this._source = source
    this._projector = new Projector(this)
  }

  static {
    compose(this, RangePart, {
      begin() { return new this.cursorType(this, this.source$.begin()) },
      end() { return new this.cursorType(this, this.source$.end()) },
    })

    compose(this, VirtualContainerPart, {
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
      get projector$() { return this._projector },
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
