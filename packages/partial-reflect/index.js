import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { 
  Implements, 
  Extends,
  Defines,
  CreateThunk,
} from '@kingjs/partial-symbols'
import { 
  create, 
  isFirstOrOverride,
  publishExtensions 
} from '@kingjs/partial-reflector'

export { 
  isTransparent,
  isPartialType 
} from '@kingjs/partial-reflector'

const MetaKeys = [
  Defines,      // from Attachments
  Extends,      // from PartialClass
  Implements,   // from Concept
]

export const PartialReflect = create({
  knownStaticKeys: MetaKeys,
})

export function extend(type, partialType) {
  assert(!isPojo(type))
  
  const hosts = new Set()
  const prototype = type.prototype
  PartialReflect.copyTo(partialType, prototype, {
    createThunk: (key, descriptor) => CreateThunk in type 
      ? type[CreateThunk](key, descriptor) 
      : descriptor,

    filter: (host, key, descriptor) =>
      isFirstOrOverride(descriptor, key in prototype),

    onHost: (host) => 
      hosts.add(host),
  })

  const mergeOrder = [...hosts].reverse()
  publishExtensions(type, ...mergeOrder)
}
