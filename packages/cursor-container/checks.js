import { Metadata } from '@kingjs/metadata'
import { throwEmpty } from '@kingjs/cursor'

export class NotEmpty extends Metadata {
  static [Symbol.hasInstance](container) {
    if (!container.isEmpty)
      return true

    throwEmpty()
  }
}
