import { Metadata } from '@kingjs/metadata'

export class NotEmpty extends Metadata {
  static [Symbol.hasInstance](container) {
    return !container.isEmpty
  }
}
