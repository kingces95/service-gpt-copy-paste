import { Metadata } from '@kingjs/metadata'
import { throwEmpty } from '@kingjs/cursor'

export class NormalNumber extends Metadata {
  static [Symbol.hasInstance](value) {
    if (Number.isInteger(value) && value >= 0)
      return true

    throw new RangeError(
      'Argument must be a non-negative integer.')
  }
}

export class NotEmpty extends Metadata {
  static [Symbol.hasInstance](container) {
    if (!container.isEmpty)
      return true

    throwEmpty()
  }
}
