import { assert } from '@kingjs/assert'
import {
  NativeByteOrder,
  Utf16ByteOrderMarks,
  Utf32ByteOrderMarks,
  Utf8Signature,
} from '@kingjs/unicode'
import { PreambleScanner } from './preamble-scanner.js'
import { Utf8CodePointContainer } from './container/utf8-code-point-container.js'
import {
  Utf16BECodePointContainer,
  Utf16LECodePointContainer,
} from './container/utf16-code-point-container.js'
import {
  Utf32BECodePointContainer,
  Utf32LECodePointContainer,
} from './container/utf32-code-point-container.js'

export const UnicodePreambles = {
  utf32be: Utf32ByteOrderMarks.big,
  utf32le: Utf32ByteOrderMarks.little,
  utf8: Utf8Signature.signature,
  utf16be: Utf16ByteOrderMarks.big,
  utf16le: Utf16ByteOrderMarks.little,
}

const CodePointContainerTypes = {
  utf8: Utf8CodePointContainer,
  utf16be: Utf16BECodePointContainer,
  utf16le: Utf16LECodePointContainer,
  utf32be: Utf32BECodePointContainer,
  utf32le: Utf32LECodePointContainer,
}

export class UnicodeActivator {
  _container
  _defaultEncoding
  _requirePreamble
  _scanner

  constructor({
    defaultEncoding = null,
    requirePreamble = false,
  } = { }) {
    assert(defaultEncoding == null || defaultEncoding in CodePointContainerTypes,
      'Default Unicode encoding is not supported.')

    this._container = null
    this._defaultEncoding = defaultEncoding
    this._requirePreamble = requirePreamble
    this._scanner = new PreambleScanner({
      sequences: UnicodePreambles,
      onPreamble: result => this._activate(result),
    })
  }

  get container() { return this._container }

  pushRange(range) {
    if (this._container) {
      this._container.pushRange(range)
      return this._container
    }

    this._scanner.pushRange(range)
    return this._container
  }

  _activate({ match, remainder }) {
    const encoding = match ?? this._defaultEncoding
    assert(encoding,
      'Unicode preamble is required to activate without a default encoding.')
    assert(!this._requirePreamble || match,
      'Unicode preamble is required.')

    const Type = CodePointContainerTypes[encoding]
    assert(Type, 'Unicode encoding is not supported.')

    this._container = new Type()
    for (const range of remainder.ranges())
      this._container.pushRange(range)
  }
}

export function unicodeActivator(options) {
  return new UnicodeActivator(options)
}
