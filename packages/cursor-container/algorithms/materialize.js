import { genericMethod } from '@kingjs/generic'
import { ConstructsOf } from '@kingjs/simple-type'
import { DefaultConstructibleProbe } from '@kingjs/probe'
import { PushBackContainerShape } from '@kingjs/cursor-shape'
import { ArrayMapOf } from '../container/array-map.js'

const ArrayMap = ArrayMapOf(Object)

const of = genericMethod(
  [[ // type
    DefaultConstructibleProbe,
    ConstructsOf(PushBackContainerShape),
  ]],
  type => function materialize(range) {
    const result = new type()
    const first = range.begin()
    const last = range.end()

    while (!first.equals(last)) {
      result.pushBack(first.value)
      first.step()
    }

    return result
  }
)

export function materialize(...args) {
  return of(ArrayMap)(...args)
}

materialize.of = of
