import {
  FixedStrideRangeContainerOf,
  ProjectedRangePart,
} from '@kingjs/cursor-container-ranges'
import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { genericType } from '@kingjs/generic'
import {
  assertScalarValue,
} from '@kingjs/unicode'
import {
  Utf32CodeUnitContainerOf,
} from './utf32-code-unit-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

export const Utf32CodePointContainerOf = genericType(TSpan => {
  const FixedStrideRangeContainer = FixedStrideRangeContainerOf(TSpan)
  const Utf32CodeUnitContainer = Utf32CodeUnitContainerOf(TSpan)

  return class Utf32CodePointContainer extends FixedStrideRangeContainer {
    constructor({ source = null, byteOrder = null } = { }) {
      source ??= new Utf32CodeUnitContainer({ byteOrder })
      assert(source instanceof Utf32CodeUnitContainer,
        'UTF-32 code point source must be a UTF-32 code unit container.')

      super(source)
    }

    static {
      compose(this, StringMaterializationPart, {
        toStrings() { return this.source$.toStrings('utf-32') },
      })

      compose(this, ProjectedRangePart, {
        decodeToken$(sourceCursor) {
          const value = sourceCursor.value
          assertScalarValue(value)
          return value
        },
      })
    }
  }
})

export const Utf32CodePointContainer = Utf32CodePointContainerOf(Object)
