import { PartialReflect } from '@kingjs/partial-reflect'

export function extend(type, ...partials) {
  for (const partial of partials)
    PartialReflect.merge(type, PartialReflect.defineType(partial))
}
