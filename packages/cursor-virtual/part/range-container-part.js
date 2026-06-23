import { CursorConcept } from '@kingjs/cursor'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  ContiguousRangeShape,
} from '@kingjs/cursor-shape'
import { ContainerPart } from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import {
  Defines,
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class RangeContainerPart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    pushRange: {
      types: [ContiguousRangeShape],
      method(range) { },
    },

    popRangeAt: {
      types: [CursorConcept],
      defaults: [defaultTo(({ self }) => self.end())],
      precondition(cursor) {
        this.ownCursorAssert$(cursor)
      },
      method(cursor /* = this.end() */) { },
    },

    popRange(sequence, options) { },

    ranges() { },
  })

  static [Defines] = members(this, {
    materialize() {
      const spans = []
      let size = 0

      for (const range of iterate(this.ranges())) {
        const span = range.span()
        spans.push(span)
        size += span.length
      }

      const result = new Uint8Array(size)
      let offset = 0

      for (const span of spans) {
        result.set(span, offset)
        offset += span.length
      }

      return result
    },
  })
}
