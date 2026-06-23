import { CursorConcept } from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  ContainerPart,
} from '@kingjs/cursor-container'
import { Defines } from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class SplittableRangePart extends ContainerPart {
  static [Defines] = members(this, {
    splitAt: {
      types: [CursorConcept],
      precondition(cursor) {
        this.ownCursorAssert$(cursor)
      },
      method(cursor) {
        const source = this.popRangeAt(cursor)
        const result = new this.constructor()

        for (const range of iterate(source.ranges()))
          result.pushRange(range)

        return result
      },
    },

    split(sequence, options) {
      const source = this.popRange(sequence, options)

      if (!source)
        return null

      const result = new this.constructor()

      for (const range of iterate(source.ranges()))
        result.pushRange(range)

      return result
    },
  })
}
