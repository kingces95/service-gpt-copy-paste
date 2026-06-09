import {
  FixedStrideRangeContainer,
  ProjectedRangePart,
} from '@kingjs/cursor-container-ranges'
import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import {
  assertScalarValue,
} from '@kingjs/unicode'
import { Utf32CodeUnitContainer } from './utf32-code-unit-container.js'

export class Utf32CodePointContainer extends FixedStrideRangeContainer {
  constructor({ source = null, byteOrder = null } = { }) {
    source ??= new Utf32CodeUnitContainer({ byteOrder })
    assert(source instanceof Utf32CodeUnitContainer,
      'UTF-32 code point source must be a UTF-32 code unit container.')

    super(source)
  }

  static {
    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assertScalarValue(value)
        return value
      },
    })

  }
}
