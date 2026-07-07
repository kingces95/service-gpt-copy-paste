import {
  retreat,
} from '@kingjs/cursor-algorithm'
import { UnicodeEncoding } from '@kingjs/unicode'

export class CliTextBuffer {
  #input
  #encoding

  constructor(encoding, input) {
    this.#encoding = encoding instanceof UnicodeEncoding
      ? encoding
      : UnicodeEncoding.from(encoding)
    this.#input = input
  }

  #decode(range) {
    return this.#encoding.decodeChunks(range.spans())
  }

  read() {
    return this.#input.isEmpty ? '' : this.#decode(this.#input.popAll())
  }

  tryReadLine({
    keepNewLines = false,
    keepCarriageReturns = false
  } = {}) {
    const stripNewLines = !keepNewLines
    const stripCarriageReturns = !keepCarriageReturns
    const needle = this.#encoding.encodeString('\n')
    let committed = this.#input.popRange(needle)

    if (!committed)
      return null

    if (stripNewLines)
      committed = committed.popRangeAt(
        retreat(committed.end(), needle.length))

    let result = this.#decode(committed)

    if (stripNewLines && stripCarriageReturns && result.endsWith('\r'))
      result = result.slice(0, -1)

    return result
  }

  tryReadString(charCount) {
    const byteCount = charCount * this.#encoding.countByteWidth
    const bytes = this.#input.materialize(byteCount)
    const text = this.#encoding.decodeChunk(bytes)

    if (bytes.length < byteCount)
      return null

    if (text.length != charCount)
      throw new Error(
        'Counted string reads only support fixed-width text.')

    this.#input.popBytes(byteCount)
    return text
  }
}
