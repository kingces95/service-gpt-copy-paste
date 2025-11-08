import { Extension } from '@kingjs/extension'

export function extend(type, ...partials) {

  // for each extension, compile and bind its members to the type prototype
  for (const partial of partials)
    Extension.fromArg(partial).defineOn(type)
}
