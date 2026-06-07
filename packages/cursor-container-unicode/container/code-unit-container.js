import { define } from '@kingjs/partial-define'
import {
  FixedProjectedRangeContainer,
  ProjectedRangeContainer,
} from '@kingjs/cursor-container-ranges'
import { ByteOrderUnitContainer } from './byte-order-unit-container.js'

const projectedSplit = ProjectedRangeContainer.prototype.split

export class CodeUnitContainer extends FixedProjectedRangeContainer {
  constructor({ byteOrder, byteWidth }) {
    super(new ByteOrderUnitContainer({ byteOrder, byteWidth }), {
      fixedStride: 1,
    })
  }

  get byteOrder() { return this.source.byteOrder }
  get byteWidth() { return this.source.byteWidth }

  static {
    define(this, {
      split(cursor = this.end(), result = null) {
        result ??= new this.constructor({
          byteOrder: this.byteOrder,
          byteWidth: this.byteWidth,
        })

        return projectedSplit.call(this, cursor, result)
      },

      decodeToken$(sourceCursor, stride) {
        const value = sourceCursor.value
        sourceCursor.step()
        return value
      },
    })
  }
}
