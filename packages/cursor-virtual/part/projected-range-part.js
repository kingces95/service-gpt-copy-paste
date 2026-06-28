import {
  DefinesAbstract,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'
import {
  ContainerPart,
} from '@kingjs/cursor-container'

export class ProjectedRangePart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    get source$() { },
    stepValue$(sourceCursor) { },
    stepBackValue$(sourceCursor) { },
    trimEnd$(sourceCursor) { },
    decodeValue$(sourceCursor) { },
  })
}
