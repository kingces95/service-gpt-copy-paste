import { Buffer } from 'node:buffer'
import { StringDecoder } from 'node:string_decoder'
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

function toBufferView(span) {
  return Buffer.from(span.buffer, span.byteOffset, span.byteLength)
}

export function* utf8RangesToStrings(ranges) {
  const decoder = new StringDecoder('utf8')

  for (const range of iterate(ranges)) {
    const decoded = decoder.write(toBufferView(toByteSpan(range)))
    if (decoded)
      yield decoded
  }

  const tail = decoder.end()
  if (tail)
    yield tail
}

export function utf8RangesToString(ranges) {
  return [...utf8RangesToStrings(ranges)].join('')
}
