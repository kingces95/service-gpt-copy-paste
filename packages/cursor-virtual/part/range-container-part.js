import { CursorConcept } from '@kingjs/cursor'
import { assert } from '@kingjs/assert'
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

function sourceNeedle(needle) {
  if (needle instanceof Uint8Array)
    return needle

  if (typeof needle?.materialize == 'function')
    return needle.materialize()

  assert(false,
    'Range needle must be a Uint8Array or materializable range.')
}

export class RangeContainerPart extends ContainerPart {
  static [DefinesAbstract] = members(this, {
    get bytesPushed() { },
    get bytesPopped() { },

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

    popRange$(needle, options) { },

    ranges() { },
  })

  static [Defines] = members(this, {
    *spans() {
      for (const range of this.ranges())
        yield range.span()
    },

    materialize() {
      const spans = []
      let size = 0

      for (const span of this.spans()) {
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

    popRange: {
      transforms: [sourceNeedle],
      method(needle, options) {
        return this.popRange$(needle, options)
      },
    },

    splitAt: {
      types: [CursorConcept],
      precondition(cursor) {
        this.ownCursorAssert$(cursor)
      },
      method(cursor) {
        const source = this.popRangeAt(cursor)
        const result = new this.constructor()

        for (const range of source.ranges())
          result.pushRange(range)

        return result
      },
    },

    split(needle, options) {
      const source = this.popRange(needle, options)

      if (!source)
        return null

      const result = new this.constructor()

      for (const range of source.ranges())
        result.pushRange(range)

      return result
    },
  })
}
