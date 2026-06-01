import { assert } from '@kingjs/assert'
import {
  PartialReflect,
  copyTo,
} from '@kingjs/partial-reflect'
import { PartialType, Normalize } from '@kingjs/partial-type'
import { templatize } from '@kingjs/templatize'
import { extensionOf } from '@kingjs/type-traits'
import { contract } from '@kingjs/function-contract'
import { Tuple } from '@kingjs/tuple'
import { Descriptor } from '@kingjs/descriptor'
import { isAbstract } from '@kingjs/abstract'
import { getOwn } from '@kingjs/get-own'
import { AbstractAttachments } from '@kingjs/partial-attachments'
import { PartialImplementation } from '@kingjs/partial-implementation'
import {
  Implementations,
  Procedurals,
  isTransparent,
} from '@kingjs/partial-symbols'
import { asMetadata } from '@kingjs/as-metadata'

function formatKey(key) {
  return typeof key == 'symbol'
    ? key.toString()
    : key
}

const ApplyDeclarationNames = Tuple.of(
  'type', 'declaration', 'implementation', 'stillAbstract')

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

export function assertAbstractsAccountedFor(
  type,
  declaration,
  implementation,
  stillAbstract,
) {
  for (const key of PartialReflect.ownKeys(declaration)) {
    const declarationDescriptor =
      PartialReflect.getOwnDescriptor(declaration, key)
    if (!isAbstract(declarationDescriptor))
      continue

    const implementationDescriptor =
      PartialReflect.getOwnDescriptor(implementation, key)
    const stillAbstractDescriptor =
      PartialReflect.getOwnDescriptor(stillAbstract, key)
    const typeDescriptor =
      Descriptor.get(type.prototype, key)

    if (implementationDescriptor || typeDescriptor)
      continue

    if (stillAbstractDescriptor)
      continue

    throw new Error(
      `${declaration.name} member '${formatKey(key)}' is not accounted for.`)
  }
}

function supportsDescriptor(declaration, implementation) {
  return Descriptor.equalSlots(declaration, implementation)
    || Descriptor.isAccessorHalfOf(implementation, declaration)
}

function publishOwnMetadata(type, symbol, value) {
  const current = getOwn(type, symbol)
  assert(current == null || !Object.isFrozen(current),
    'Type cannot be modified after it has been loaded.')

  const values = [...asMetadata(current)]
    .filter(current => current != value)
  values.push(value)
  type[symbol] = values
}

function publishProcedural(type, partialType) {
  assert(!isTransparent(partialType),
    'Transparent types cannot be adjacent types.')

  publishOwnMetadata(type, Procedurals, partialType)
}

function assertTopologicalNext(type, declaration) {
  const procedurals = [...asMetadata(getOwn(type, Procedurals))]
  for (const procedural of procedurals)
    if (PartialReflect.isComposedOf(procedural, declaration))
      throw new TypeError(
        `${declaration.name} must be attached before ${procedural.name}.`)
}

export const ApplyDeclaration = templatize([
  extensionOf(PartialType),
  extensionOf(PartialType),
], (TDeclaration, TImplementation) => contract([
  Function,
  extensionOf(TDeclaration),
], ApplyDeclarationNames,
function applyDeclaration(
  type,
  declaration,
  implementation = { },
  stillAbstract = { },
) {
  implementation = TImplementation[Normalize](implementation)
  stillAbstract = AbstractAttachments[Normalize](stillAbstract)

  assert(PartialReflect.isExtensionOf(implementation, TImplementation),
    `Argument implementation must extend ${TImplementation.name}.`)
  assert(PartialReflect.isExtensionOf(stillAbstract, AbstractAttachments),
    `Argument stillAbstract must extend ${AbstractAttachments.name}.`)

  assertDescriptors(declaration, implementation)
  assertDescriptors(declaration, stillAbstract)
  assertAbstractsAccountedFor(type, declaration, implementation, stillAbstract)

  implementation =
    PartialImplementation.create(type, declaration, implementation)

  if (PartialType.isUserDefined(type) && !isTransparent(type)) {
    publishProcedural(type, declaration)
    publishOwnMetadata(type, Implementations, implementation)
  }
  else {
    if (!isTransparent(declaration)) {
      assertTopologicalNext(type, declaration)
      publishProcedural(type, declaration)
    }

    copyTo(declaration, type)
    copyTo(implementation, type)
  }
}))
