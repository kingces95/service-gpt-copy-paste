import { contract } from '@kingjs/function-contract'
import { templatize } from '@kingjs/templatize'
import { Constructs } from '@kingjs/constructs'
import {
  DefaultConstructible,
  PushProbe,
} from '@kingjs/cursor-checks'
import { ArrayMap } from '../container/array-map.js'

const Materialize = templatize(
  [[ // type
    DefaultConstructible,
    Constructs.as(PushProbe),
  ]],
  type => contract(function materialize(range) {
    const result = new type()
    const first = range.begin()
    const last = range.end()

    while (!first.equals(last)) {
      result.push(first.value)
      first.step()
    }

    return result
  })
)

export const materialize = Materialize.as(ArrayMap)
