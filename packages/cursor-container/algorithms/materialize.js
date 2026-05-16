import { contract } from '@kingjs/function-contract'
import { templatize } from '@kingjs/templatize'
import { Constructs } from '@kingjs/constructs'
import {
  DefaultConstructible,
  PushShape,
} from '@kingjs/cursor-checks'
import { VectorMap } from '../container/vector-map.js'

const Materialize = templatize(
  [[ // type
    DefaultConstructible,
    Constructs.as(PushShape),
  ]],
  type => contract(function materialize(first, last) {
    const result = new type()

    if (first.clone)
      first = first.clone()

    while (!first.equals(last)) {
      result.push(first.value)
      first.step()
    }

    return result
  })
)

export const materialize = Materialize.as(VectorMap)
