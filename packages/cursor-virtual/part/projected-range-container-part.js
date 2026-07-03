import { assert } from '@kingjs/assert'
import { compose } from '@kingjs/partial-compose'
import {
  DefinesAbstract,
  Fields,
  Initializer,
} from '@kingjs/partial-class'
import { members } from '@kingjs/partial-signature'
import { RangePart } from '@kingjs/cursor'
import {
  ContainerPart,
} from '@kingjs/cursor-container'
import { SplittableRangeShape } from '../shape/ranges-container-shape.js'

const CursorType = Symbol('ProjectedRangeContainerPart.CursorType')
const Source = Symbol('ProjectedRangeContainerPart.Source')

export class ProjectedRangeContainerPart extends ContainerPart {
  static [Fields] = {
    [CursorType]: undefined,
    [Source]: undefined,
  }

  static [Initializer](cursorType, source) {
    assert(typeof cursorType == 'function',
      'Projected cursor type must be a function.')
    assert(source instanceof SplittableRangeShape,
      'Virtual source must be a splittable range container.')

    this[CursorType] = cursorType
    this[Source] = source
  }

  static [DefinesAbstract] = members(this, {
    decodeValue$(sourceCursor) { },
  })

  static {
    compose(this, RangePart, {
      get cursorType() { return this[CursorType] },

      begin() {
        const sourceCursor = this.source$.begin()
        return new this.cursorType(this, sourceCursor)
      },

      end() {
        const sourceCursor = this.trimEnd$(this.source$.end())
        return new this.cursorType(this, sourceCursor)
      },
    })
  }

  get source$() { return this[Source] }

  stepValue$(sourceCursor) {
    sourceCursor.step()
  }

  stepBackValue$(sourceCursor) {
    sourceCursor.stepBack()
  }

  trimEnd$(sourceCursor) {
    return sourceCursor
  }
}
