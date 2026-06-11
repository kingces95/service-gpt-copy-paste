import { CursorConcept } from '@kingjs/cursor'
import {
  ContainerPart,
} from '@kingjs/cursor-container'
import { defaultTo } from '@kingjs/function-contract'
import { DefinesAbstract } from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class SplitContainerPart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    split: {
      types: [CursorConcept, null],
      defaults: [defaultTo(({ self }) => self.end())],
      precondition(cursor) {
        this.ownCursorAssert$(cursor)
      },
      method(cursor /* = this.end() */, result = null) { },
    },
  })
}
