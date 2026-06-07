import {
  FixedProjectedRangeContainer,
  ProjectedRangeContainer,
} from '@kingjs/cursor-container-ranges'
import { define } from '@kingjs/partial-define'
import {
  assertByteOrder,
  assertScalarValue,
} from '@kingjs/unicode'
import { Utf32CodeUnitContainer } from './utf32-code-unit-container.js'

const projectedSplit = ProjectedRangeContainer.prototype.split

export class Utf32CodePointContainer extends FixedProjectedRangeContainer {
  _byteOrder

  constructor({ byteOrder }) {
    assertByteOrder(byteOrder)
    super(new Utf32CodeUnitContainer({ byteOrder }), { fixedStride: 1 })
    this._byteOrder = byteOrder
  }

  get byteOrder() { return this._byteOrder }

  static {
    define(this, {
      split(cursor = this.end(), result = null) {
        result ??= new this.constructor({ byteOrder: this.byteOrder })
        return projectedSplit.call(this, cursor, result)
      },

      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assertScalarValue(value)
        return value
      },
    })
  }
}
