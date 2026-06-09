import {
  FixedStrideRangeContainer,
  ProjectedRangePart,
  ProjectedRangeContainer,
  SplitContainerPart,
} from '@kingjs/cursor-container-ranges'
import { compose } from '@kingjs/partial-compose'
import {
  assertScalarValue,
} from '@kingjs/unicode'
import { Utf32CodeUnitContainer } from './utf32-code-unit-container.js'
import { ByteOrderedPart } from '../part/byte-ordered-part.js'

const projectedSplit = ProjectedRangeContainer.prototype.split

export class Utf32CodePointContainer extends FixedStrideRangeContainer {
  constructor({ byteOrder }) {
    super(new Utf32CodeUnitContainer({ byteOrder }), { fixedStride: 1 })
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assertScalarValue(value)
        return value
      },
    })

    compose(this, ByteOrderedPart, {
      get byteOrder() { return this.source$.byteOrder },
    })

    compose(this, SplitContainerPart, {
      split(cursor = this.end(), result = null) {
        result ??= new this.constructor({ byteOrder: this.byteOrder })
        return projectedSplit.call(this, cursor, result)
      },
    })
  }
}
