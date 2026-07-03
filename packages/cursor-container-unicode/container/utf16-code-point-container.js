import {
  ProjectedRangeContainer,
  ProjectedRangeContainerPart,
  trimContinuationSuffix,
} from '@kingjs/cursor-virtual'
import { assert } from '@kingjs/assert'
import { advance } from '@kingjs/cursor-algorithm'
import { compose } from '@kingjs/partial-compose'
import {
  assertScalarValue,
  decodeSurrogatePair,
  isHighSurrogate,
  isLowSurrogate,
} from '@kingjs/unicode'
import { Uint16 } from '@kingjs/simple-type'
import {
  Utf16BECodeUnitContainer,
  Utf16LECodeUnitContainer,
} from './code-unit-container.js'
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

function codePointLengthOf(unit) {
  return isHighSurrogate(unit) ? 2 : 1
}

export class Utf16CodePointContainer extends ProjectedRangeContainer {
  constructor(source) {
    super(source)
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() { return this.source$.toStrings() },
    })

    compose(this, ProjectedRangeContainerPart, {
      trimEnd$(sourceCursor) {
        return trimContinuationSuffix(
          this.source$,
          sourceCursor,
          {
            isContinuation: isLowSurrogate,
            lengthOf: codePointLengthOf,
          }
        )
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, codePointLengthOf(sourceCursor.value))
      },

      stepBackValue$(sourceCursor) {
        sourceCursor.stepBack()

        while (isLowSurrogate(sourceCursor.value))
          sourceCursor.stepBack()
      },

      decodeValue$(sourceCursor) {
        const first = readUnit(sourceCursor)

        if (isLowSurrogate(first))
          throw new Error('Unexpected UTF-16 low surrogate.')

        const stride = codePointLengthOf(first)

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

export class Utf16BECodePointContainer extends Utf16CodePointContainer {
  constructor() {
    super(new Utf16BECodeUnitContainer())
  }
}

export class Utf16LECodePointContainer extends Utf16CodePointContainer {
  constructor() {
    super(new Utf16LECodeUnitContainer())
  }
}
