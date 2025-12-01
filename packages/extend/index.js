import { PartialClass } from '@kingjs/partial-class'
import { MemberReflect } from '@kingjs/member-reflect'

export function extend(type, ...partials) {

  // for each extension, compile and bind its members to the type prototype
  for (const partial of partials)
    MemberReflect.merge(type, 
      PartialClass.fromArg(partial))
}
