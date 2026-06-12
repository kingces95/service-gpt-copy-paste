import {
  ContainerPart,
} from '@kingjs/cursor-container'
import { DefinesAbstract } from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class VirtualPart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    get source$() { },
    decodeToken$(sourceCursor, stride) { },
  })
}
