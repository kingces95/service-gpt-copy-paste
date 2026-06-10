import { iterate } from '@kingjs/cursor-algorithm'

function toByteSpan(range) {
  const begin = range.begin()
  const end = range.end()
  const source = begin.range

  if (source != end.range)
    throw new Error('Expected byte range cursors to share a source range.')

  if (typeof source?.span != 'function')
    throw new Error('Expected committed byte range to expose span().')

  const span = source.span(begin, end)
  if (!(ArrayBuffer.isView(span) && span.BYTES_PER_ELEMENT == 1))
    throw new Error('Expected committed byte range span to be bytes.')

  return span
}

function bufferOf(span) {
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

export function* byteRangesToStrings(ranges, encodingOf) {
  let decoder = null

  for (const range of iterate(ranges)) {
    decoder ??= new TextDecoder(
      typeof encodingOf == 'function' ? encodingOf() : encodingOf
    )
    const decoded = decoder.decode(bufferOf(toByteSpan(range)), {
      stream: true,
    })

    if (decoded)
      yield decoded
  }

  const tail = decoder?.decode()
  if (tail)
    yield tail
}
