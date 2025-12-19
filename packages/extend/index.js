import { TransparentPartialClass } from '@kingjs/transparent-partial-class'
import { PartialReflect } from '@kingjs/partial-reflect'

export function extend(type, ...partials) {
  for (const partial of partials)
    PartialReflect.merge(type, TransparentPartialClass.fromArg(partial))
}
