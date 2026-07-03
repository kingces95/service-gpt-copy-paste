import { describe, expect, it } from 'vitest'
import {
  iterate,
} from '@kingjs/cursor-algorithm'
import { TypedArrayView } from '@kingjs/cursor-view'
import { compose } from '@kingjs/partial-compose'
import {
  ProjectedRangeContainer,
  ProjectedRangeContainerPart,
  VirtualContainer,
} from '../index.js'
import { advance, previous, retreat } from '@kingjs/cursor-algorithm'

class PairRange extends ProjectedRangeContainer {
  constructor({ throwOnFirst = false } = { }) {
    super(new VirtualContainer())
    this.throwOnFirst = throwOnFirst
  }

  static {
    compose(this, ProjectedRangeContainerPart, {
      trimEnd$(sourceCursor) {
        return previous(sourceCursor, this.bytesPushed % 2)
      },

      stepValue$(sourceCursor) {
        advance(sourceCursor, 2)
      },

      stepBackValue$(sourceCursor) {
        retreat(sourceCursor, 2)
      },

      decodeValue$(sourceCursor) {
        const first = sourceCursor.value
        if (this.throwOnFirst && first == 0)
          throw new Error('Fallback should start at the page tail.')

        sourceCursor.step()
        return first
      },
    })
  }
}

function pairRangeOf(...chunks) {
  const result = new PairRange()

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

function throwingPairRangeOf(...chunks) {
  const result = new PairRange({ throwOnFirst: true })

  for (const chunk of chunks)
    result.pushRange(new TypedArrayView(Uint8Array.from(chunk)))

  return result
}

function valuesOf(range) {
  return [...iterate(range)]
}

describe('fixed stride page search', () => {
  it('bounds cross-page fallback to the fixed-stride page tail', () => {
    const haystack = throwingPairRangeOf([0, 1, 2, 3], [4, 5])
    const needle = pairRangeOf([2, 3, 4, 5])
    const committed = haystack.split(needle)

    expect(valuesOf(committed)).toEqual([0, 2, 4])
    expect(haystack.isEmpty).toBe(true)
  })
})
