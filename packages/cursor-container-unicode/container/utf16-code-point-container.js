import {
  ProjectedRangePart,
  VariableStrideProjectedRangeContainer,
} from '@kingjs/cursor-virtual'
import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import { genericType } from '@kingjs/generic'
import {
  assertScalarValue,
  decodeSurrogatePair,
  isHighSurrogate,
  isLowSurrogate,
} from '@kingjs/unicode'
import { Uint16 } from '@kingjs/simple-type'
import {
  Utf16CodeUnitContainerOf,
} from './utf16-code-unit-container.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

function unitAt(cursor) {
  const value = cursor.value
  if (!(value instanceof Uint16))
    throw new Error('Expected UTF-16 source value to be Uint16.')

  return value
}

function readUnit(cursor) {
  const value = unitAt(cursor)
  cursor.step()
  return value
}

export const Utf16CodePointContainerOf = genericType(TSpan => {
  const Utf16CodeUnitContainer = Utf16CodeUnitContainerOf(TSpan)

  return class Utf16CodePointContainer extends VariableStrideProjectedRangeContainer {
    constructor({ source = null, byteOrder = null } = { }) {
      source ??= new Utf16CodeUnitContainer({ byteOrder })
      assert(source instanceof Utf16CodeUnitContainer,
        'UTF-16 code point source must be a UTF-16 code unit container.')

      super(source, {
        isContinuation: isLowSurrogate,
        continuationCountOf: unit => isHighSurrogate(unit) ? 1 : 0,
      })
    }

    static {
      compose(this, StringMaterializationPart, {
        toStrings() { return this.source$.toStrings('utf-16') },
      })

      compose(this, ProjectedRangePart, {
        decodeToken$(sourceCursor, stride) {
          const first = readUnit(sourceCursor)

          if (isLowSurrogate(first))
            throw new Error('Unexpected UTF-16 low surrogate.')

          if (stride == 1) {
            assertScalarValue(first)
            return first
          }

          assert(stride == 2,
            'UTF-16 code point stride must be one or two.')

          const second = readUnit(sourceCursor)
          if (!isLowSurrogate(second))
            throw new Error('Expected UTF-16 low surrogate.')

          return decodeSurrogatePair(first, second)
        },
      })
    }
  }
})

export const Utf16CodePointContainer = Utf16CodePointContainerOf(Object)
