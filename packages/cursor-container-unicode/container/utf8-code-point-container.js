import {
  ProjectedRangeContainer,
  ProjectedRangeContainerPart,
  VirtualContainer,
  trimContinuationSuffix,
} from '@kingjs/cursor-virtual'
import { advance } from '@kingjs/cursor-algorithm'
import { compose } from '@kingjs/partial-compose'
import {
  decodeUtf8Sequence,
  utf8ContinuationCount,
  utf8ContinuationPayload,
  isUtf8ContinuationByte,
} from '@kingjs/unicode'
import { Uint8 } from '@kingjs/simple-type'
import {
  byteSpansToStrings,
} from '../source-ranges-to-string.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

function byteAt(cursor) {
  const value = cursor.value
  if (!(value instanceof Uint8))
    throw new Error('Expected UTF-8 source value to be Uint8.')

  return value
}

function readByte(cursor) {
  const value = byteAt(cursor)
  cursor.step()
  return value
}

function readContinuation(cursor) {
  return utf8ContinuationPayload(readByte(cursor))
}

function codePointLengthOf(byte) {
  return 1 + utf8ContinuationCount(byte)
}

export class Utf8CodePointContainer extends ProjectedRangeContainer {
  constructor() {
    super(new VirtualContainer())
  }

  static {
    compose(this, StringMaterializationPart, {
      toStrings() {
        return byteSpansToStrings(this.source$.spans(), 'utf-8')
      },
    })

    compose(this, ProjectedRangeContainerPart, {
      trimEnd$(sourceCursor) {
        return trimContinuationSuffix(
          this.source$,
          sourceCursor,
          {
            isContinuation: isUtf8ContinuationByte,
            lengthOf: codePointLengthOf,
          }
        )
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, codePointLengthOf(sourceCursor.value))
      },

      stepBackValue$(sourceCursor) {
        sourceCursor.stepBack()

        while (isUtf8ContinuationByte(sourceCursor.value))
          sourceCursor.stepBack()
      },

      decodeValue$(sourceCursor) {
        const first = readByte(sourceCursor)
        const parts = []
        const stride = codePointLengthOf(first)

        for (let i = 1; i < stride; i++)
          parts.push(readContinuation(sourceCursor))

        const value = decodeUtf8Sequence(first, parts)

        return value
      },
    })
  }
}
