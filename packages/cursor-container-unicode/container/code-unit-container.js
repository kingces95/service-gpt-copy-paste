import { compose } from '@kingjs/partial-compose'
import {
  FixedStrideRangeContainer,
  ProjectedRangePart,
  ProjectedRangeContainer,
  SplitContainerPart,
} from '@kingjs/cursor-container-ranges'
import { ByteOrderedContainer } from './byte-ordered-container.js'
import { ByteOrderedPart } from '../part/byte-ordered-part.js'

const projectedSplit = ProjectedRangeContainer.prototype.split

export class CodeUnitContainer extends FixedStrideRangeContainer {
  constructor({ byteOrder, byteWidth }) {
    super(new ByteOrderedContainer({
      byteOrder,
      byteWidth,
    }), {
      fixedStride: 1,
    })
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor, stride) {
        const value = sourceCursor.value
        sourceCursor.step()
        return value
      },
    })

    compose(this, ByteOrderedPart, {
      get byteOrder() { return this.source$.byteOrder },
    })

    compose(this, SplitContainerPart, {
      split(cursor = this.end(), result = null) {
        result ??= new this.constructor({
          byteOrder: this.byteOrder,
        })

        return projectedSplit.call(this, cursor, result)
      },
    })
  }
}
