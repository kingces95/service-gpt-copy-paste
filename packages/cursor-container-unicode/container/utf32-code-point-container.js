import { FixedProjectedRangeContainer } from '@kingjs/cursor-container-ranges'
import { define } from '@kingjs/partial-define'
import { assertScalarValue } from '@kingjs/unicode'
import { Utf32CodeUnitContainer } from './utf32-code-unit-container.js'

export class Utf32CodePointContainer extends FixedProjectedRangeContainer {
  constructor() {
    super(new Utf32CodeUnitContainer(), { fixedStride: 1 })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor) {
        const value = sourceCursor.value
        assertScalarValue(value)
        return value
      },
    })
  }
}
