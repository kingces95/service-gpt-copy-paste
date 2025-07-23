import { Reflection } from '@kingjs/reflection'

const {
  namesAndSymbols,
  getDescriptor,
  toDescriptor,
} = Reflection

export const Bind = Symbol('Bind')
export const Extensions = Symbol('Extensions')

export class PartialClass { 
  static [Extensions] = PartialClass
  static [Bind](type, partialType, name, descriptor) {
    // assign defaults to the descriptor and use it to define the member
    return toDescriptor(descriptor)
  }
}

function implement$(type, partialType) {
  if (!partialType) return
  if (!(partialType.prototype instanceof PartialClass)) throw new TypeError(
    'partial implementation must be an instance of PartialClass')
  
  const typePrototype = type.prototype
  const typeNames = new Set(namesAndSymbols(typePrototype))

  const partialTypePrototype = partialType.prototype
  for (const name of namesAndSymbols(partialTypePrototype, PartialClass)) {
    if (name === 'constructor') continue
    if (typeNames.has(name)) continue

    // given the partial type, member name, and member metadata,
    // bind to a descriptor that can be used to define the member
    const descriptor = partialType[Bind](
      type, partialType, name, getDescriptor(partialTypePrototype, name))
    if (!descriptor) throw new Error(
      `Type ${type.name} failed to bind "${partialType.name}.${name}".`)
      
    // add the descriptor to the type prototype
    Object.defineProperty(typePrototype, name, descriptor)
  }
}

// For each member found on a partial type, "bind" the member to
// a descriptor that can be used to define the member on the type
// prototype given the partial type, name, and partial type member
// descriptor. If a member of the same name already exists on the type
// prototype, the member on the partial type is not copied.

// If the partial type has an Extensions property, it is also
// implemented on the type prototype. The Extensions property is
// expected to also be a partial type. The impetus for this is to 
// allow concepts to extend PartialType, overriding the Bind method
// to allow the target type to provide custom binding logic while
// still allowing the partial type to provide "extensions" to the 
// concept. 
export function implement(type, ...partialTypes) {
  for (const partialType of partialTypes) {
    implement$(type, partialType)

    const extensions = partialType[Extensions]
    if (extensions != PartialClass) 
      implement$(type, extensions)
  }
}
