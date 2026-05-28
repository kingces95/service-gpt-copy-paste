import { assert } from '@kingjs/assert'
import { PartialReflect, copyTo } from '@kingjs/partial-reflect'
import { PartialType } from '@kingjs/partial-type'
import { From } from '@kingjs/partial-symbols'
import { templatize } from '@kingjs/templatize'
import { extensionOf } from '@kingjs/type-traits'
import { contract } from '@kingjs/function-contract'
import { Tuple } from '@kingjs/tuple'
import { Descriptor } from '@kingjs/descriptor'

function formatKey(key) {
  return typeof key == 'symbol'
    ? key.toString()
    : key
}

const ApplyDeclarationNames = Tuple.of('type', 'declaration', 'implementation')

export function assertDescriptors(declaration, implementation) {
  for (const key of PartialReflect.ownKeys(implementation)) {
    const implementationDescriptor =
      PartialReflect.getOwnDescriptor(implementation, key)
    const declarationDescriptor =
      PartialReflect.getOwnDescriptor(declaration, key)

    if (!declarationDescriptor)
      throw new Error(
        `${declaration.name} does not define member '${formatKey(key)}'.`)

    if (!supportsDescriptor(declarationDescriptor, implementationDescriptor))
      throw new Error(
        `${declaration.name} does not support member ` +
        `'${formatKey(key)}'.`)
  }
}

function supportsDescriptor(declaration, implementation) {
  return Descriptor.equalSlots(declaration, implementation)
    || Descriptor.isAccessorHalfOf(implementation, declaration)
}

export const ApplyDeclaration = templatize([
  extensionOf(PartialType, { strict: true }),
  extensionOf(PartialType, { strict: true }),
], (TDeclaration, TImplementation) => contract([
  Function,
  extensionOf(TDeclaration, { strict: true }),
], ApplyDeclarationNames,
function applyDeclaration(
  type,
  declaration,
  implementation = { }
) {
  implementation = TImplementation[From](implementation)
  assert(PartialReflect.isExtensionOf(implementation, TImplementation),
    `Argument implementation must extend ${TImplementation.name}.`)

  assertDescriptors(declaration, implementation)

  copyTo(declaration, type)
  copyTo(implementation, type)
}))
