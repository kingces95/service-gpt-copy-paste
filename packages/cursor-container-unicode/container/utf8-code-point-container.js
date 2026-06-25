import {
  ProjectedRangePart,
  RangeContainerPart,
  VariableStrideProjectedRangeContainer,
  VirtualContainer,
} from '@kingjs/cursor-virtual'
import { compose } from '@kingjs/partial-compose'
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
  byteSpansToStrings,
} from '../source-ranges-to-string.js'
import {
  StringMaterializationPart,
} from '../part/string-materialization-part.js'

const pushRange = VariableStrideProjectedRangeContainer.prototype.pushRange

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

export class Utf8CodePointContainer extends VariableStrideProjectedRangeContainer {
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

        for (const range of remainder.ranges())
          pushRange.call(this, range)
      },
    })
  }

  static {
    compose(this, RangeContainerPart, {
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
        return byteSpansToStrings(this.source$.spans(), 'utf-8')
      },
    })

    compose(this, ProjectedRangePart, {
      decodeToken$(sourceCursor) {
        const first = readByte(sourceCursor)
        const parts = []
        const stride = this.tokenStrideOf$(first)

        for (let i = 1; i < stride; i++)
          parts.push(readContinuation(sourceCursor))

        const value = decodeUtf8Sequence(first, parts)

        return value
      },
    })
  }
}
