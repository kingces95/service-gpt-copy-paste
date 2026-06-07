import { assert } from '@kingjs/assert'
import { define } from '@kingjs/partial-define'
import { Uint8 } from '@kingjs/simple-type'
import {
  FixedProjectedRangeContainer,
  ProjectedRangeContainer,
  RangeContainer,
} from '@kingjs/cursor-container-ranges'
import {
  assertByteOrder,
  decodeBytes,
} from '@kingjs/unicode'

function byteAt(cursor) {
  const value = cursor.value
  assert(value instanceof Uint8,
    'Expected source value to be Uint8.')

  return value
}

const projectedSplit = ProjectedRangeContainer.prototype.split

export class ByteOrderUnitContainer extends FixedProjectedRangeContainer {
  _byteOrder
  _byteWidth

  constructor({ byteOrder, byteWidth }) {
    assertByteOrder(byteOrder)
    assert(byteWidth > 1,
      'Byte width must be greater than one.')

    super(new RangeContainer(), { fixedStride: byteWidth })
    this._byteOrder = byteOrder
    this._byteWidth = byteWidth
  }

  get byteOrder() { return this._byteOrder }
  get byteWidth() { return this._byteWidth }

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
        const bytes = []

        for (let i = 0; i < stride; i++) {
          bytes.push(byteAt(sourceCursor))
          sourceCursor.step()
        }

        return decodeBytes(bytes, this.byteOrder)
      },
    })
  }
}
