import { VariableProjectedRangeContainer } from '@kingjs/cursor-container-ranges'
import { define } from '@kingjs/partial-define'
import {
  assertScalarValue,
  decodeSurrogatePair,
  isHighSurrogate,
  isLowSurrogate,
} from '@kingjs/unicode'
import { Uint16 } from '@kingjs/simple-type'
import { Utf16CodeUnitContainer } from './utf16-code-unit-container.js'

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

export class Utf16CodePointContainer extends VariableProjectedRangeContainer {
  constructor() {
    super(new Utf16CodeUnitContainer(), {
      isContinuation: isLowSurrogate,
      continuationCountOf: unit => isHighSurrogate(unit) ? 1 : 0,
    })
  }

  static {
    define(this, {
      decodeToken$(sourceCursor, stride) {
        const first = readUnit(sourceCursor)

        if (isLowSurrogate(first))
          throw new Error('Unexpected UTF-16 low surrogate.')

        if (stride == 1) {
          assertScalarValue(first)
          return first
        }

        const second = readUnit(sourceCursor)
        if (!isLowSurrogate(second))
          throw new Error('Expected UTF-16 low surrogate.')

        return decodeSurrogatePair(first, second)
      },
    })
  }
}
