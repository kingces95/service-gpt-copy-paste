import {
  ProjectedRangePart,
  VariableStrideRangeContainer,
  RangeContainer,
} from '@kingjs/cursor-container-ranges'
import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import {
  decodeUtf8Sequence,
  utf8ContinuationCount,
  utf8ContinuationPayload,
  isUtf8ContinuationByte,
} from '@kingjs/unicode'
import { Uint8 } from '@kingjs/simple-type'
import {
  utf8RangesToString,
  utf8RangesToStrings,
} from '../utf8-ranges-to-string.js'

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

export class Utf8CodePointContainer extends VariableStrideRangeContainer {
  constructor() {
    super(new RangeContainer(), {
      isContinuation: isUtf8ContinuationByte,
      continuationCountOf: utf8ContinuationCount,
    })
  }

  static {
    define(this, {
      toStrings() {
        return utf8RangesToStrings(this.source$.ranges())
      },

      toString() {
        return utf8RangesToString(this.source$.ranges())
      },
    })

    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor, stride) {
        const first = readByte(sourceCursor)
        const parts = []

        for (let i = 1; i < stride; i++)
          parts.push(readContinuation(sourceCursor))

        const value = decodeUtf8Sequence(first, parts)

        return value
      },
    })
  }
}
