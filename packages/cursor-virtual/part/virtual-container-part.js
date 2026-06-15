import { CursorConcept } from '@kingjs/cursor'
import {
  BidirectionalRangeShape,
} from '@kingjs/cursor-shape'
import { ContainerPart } from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import {
  Defines,
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class VirtualContainerPart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    pushRange: {
      types: [BidirectionalRangeShape],
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

  static [Defines] = {
    pages() {
      return this.begin().pages(this.end())
    },
  }
}
