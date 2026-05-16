import { Metadata } from '@kingjs/metadata'
import { templatize } from '@kingjs/templatize'

export class Constructs extends Metadata {
  static [Symbol.hasInstance](type) {
    const requirements = this.targs

    if (!requirements)
      return false

    if (typeof type != 'function')
      return false

    for (const requirement of requirements)
      if (!(type.prototype instanceof requirement))
        return false

    return true
  }
}

templatize(Constructs)
