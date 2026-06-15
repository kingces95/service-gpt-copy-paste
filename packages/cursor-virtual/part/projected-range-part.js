import {
  ContainerPart,
} from '@kingjs/cursor-container'
import { DefinesAbstract } from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'

export class ProjectedRangePart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    get source$() { },
    get projector$() { },
    decodeToken$(sourceCursor, stride) { },
  })
}
