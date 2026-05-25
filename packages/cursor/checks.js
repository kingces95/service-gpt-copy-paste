import { Metadata } from '@kingjs/metadata'
import {
  throwMoveOutOfBounds,
  throwValueOutOfBounds,
} from './throw.js'

export class NotAtEnd extends Metadata {
  static [Symbol.hasInstance](cursor) {
    if (!cursor.equals(cursor.range.end({ constant: true })))
      return true

    throwMoveOutOfBounds()
  }
}

export class HasValue extends Metadata {
  static [Symbol.hasInstance](cursor) {
    if (!cursor.equals(cursor.range.end({ constant: true })))
      return true

    throwValueOutOfBounds()
  }
}

export class NormalNumber extends Metadata {
  static [Symbol.hasInstance](value) {
    if (Number.isInteger(value) && value >= 0)
      return true

    throw new RangeError(
      'Argument must be a non-negative integer.')
  }
}
