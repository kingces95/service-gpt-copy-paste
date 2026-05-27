import { Metadata } from '@kingjs/metadata'

import { CursorPart } from './cursor-parts.js'

export class NotAtEnd extends Metadata {
  static [Symbol.hasInstance](cursor) {
    if (!(cursor instanceof CursorPart))
      return false

    return !cursor.isAtEnd$
  }
}

export class HasValue extends Metadata {
  static [Symbol.hasInstance](cursor) {
    return cursor instanceof NotAtEnd
  }
}
