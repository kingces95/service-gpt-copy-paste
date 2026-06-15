import {
  ProjectedRangePart,
  VirtualContainerPart,
  VariableStrideProjectedRangeContainer,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import { compose } from '@kingjs/partial-compose'
import { genericType } from '@kingjs/generic'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  decodeUtf8Sequence,
  utf8ContinuationCount,
  utf8ContinuationPayload,
  isUtf8ContinuationByte,
  Utf8Signature,
} from '@kingjs/unicode'
import { Uint8 } from '@kingjs/simple-type'
import { PreambleScanner } from '../preamble-scanner.js'
import {
  byteRangesToStringsOf,
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

export const Utf8CodePointContainerOf = genericType(TSpan => {
  const pushRange = VariableStrideProjectedRangeContainer.prototype.pushRange
  const byteRangesToStrings = byteRangesToStringsOf(TSpan)

  return class Utf8CodePointContainer extends VariableStrideProjectedRangeContainer {
    _preamble

    constructor() {
      super(new VirtualContainer(), {
        isContinuation: isUtf8ContinuationByte,
        continuationCountOf: utf8ContinuationCount,
      })

      this._preamble = new PreambleScanner({
        sequences: Utf8Signature,
        onPreamble: ({ remainder }) => {
          this._preamble = null

          for (const range of iterate(remainder.ranges()))
            pushRange.call(this, range)
        },
      })
    }

    static {
      compose(this, VirtualContainerPart, {
        pushRange(range) {
          if (this._preamble)
            this._preamble.pushRange(range)
          else
            pushRange.call(this, range)

          return this
        },
      })

      compose(this, StringMaterializationPart, {
        toStrings() {
          return byteRangesToStrings(this.source$.ranges(), 'utf-8')
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
})

export const Utf8CodePointContainer = Utf8CodePointContainerOf(Object)
