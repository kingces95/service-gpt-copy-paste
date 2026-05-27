import { Metadata } from '@kingjs/metadata'

export class NormalNumber extends Metadata {
  static [Symbol.hasInstance](value) {
    return Number.isInteger(value) && value >= 0
  }
}
