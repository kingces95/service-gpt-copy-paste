import { CursorConcept } from '@kingjs/cursor'
import {
  ContiguousRangeShape,
} from '@kingjs/cursor-shape'
import { ContainerPart } from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import {
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class VirtualContainerPart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    pushRange: {
      types: [ContiguousRangeShape],
      method(range) { },
    },

    popRange: {
      types: [CursorConcept],
      defaults: [defaultTo(({ self }) => self.end())],
      precondition(cursor) {
        this.ownCursorAssert$(cursor)
      },
      method(cursor /* = this.end() */) { },
    },

    ranges() { },
  })
}
