import { Extension } from '@kingjs/extension'
import { PartialClassReflect } from '@kingjs/partial-class'

export function extend(type, ...partials) {

  // for each extension, compile and bind its members to the type prototype
  for (const partial of partials)
    PartialClassReflect.mergeMembers(type, 
      Extension.fromArg(partial))
}
