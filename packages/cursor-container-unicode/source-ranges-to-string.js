import { iterate } from '@kingjs/cursor-algorithm'
import { spansOfRange } from '@kingjs/cursor-shape'
import { assert } from '@kingjs/assert'
import { genericMethod } from '@kingjs/generic'

function assertByteSpanType(TSpan) {
  if (TSpan == Object)
    return

  assert(TSpan.BYTES_PER_ELEMENT == 1,
    'String materialization span type must be a byte span.')
}

function bufferOf(span, TSpan) {
  assert(TSpan == Object || span instanceof TSpan,
    'String materialization span must match span type.')
  assert(ArrayBuffer.isView(span) && span.BYTES_PER_ELEMENT == 1,
    'String materialization span must be bytes.')

  return new Uint8Array(span.buffer, span.byteOffset, span.byteLength)
}

export function byteOrderedEncodingOf(encoding, byteOrder) {
  switch (encoding) {
    case 'utf-16':
      switch (byteOrder) {
        case 'big': return 'utf-16be'
        case 'little': return 'utf-16le'
      }
      break
    case 'utf-32':
      throw new Error('UTF-32 string materialization is not supported.')
  }

  throw new Error('String materialization encoding is not supported.')
}

export const byteRangesToStringsOf = genericMethod(TSpan => {
  assertByteSpanType(TSpan)

  return function* byteRangesToStrings(ranges, encodingOf) {
    let decoder = null

    for (const range of iterate(ranges)) {
      decoder ??= new TextDecoder(
        typeof encodingOf == 'function' ? encodingOf() : encodingOf
      )

      for (const { span } of spansOfRange(range)) {
        const decoded = decoder.decode(bufferOf(span, TSpan), {
          stream: true,
        })

        if (decoded)
          yield decoded
      }
    }

    const tail = decoder?.decode()
    if (tail)
      yield tail
  }
})

export const byteRangesToStrings = byteRangesToStringsOf(Object)
