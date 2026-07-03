import { assert } from '@kingjs/assert'
import { isAbstract } from '@kingjs/abstract'
import { asMetadata } from '@kingjs/as-metadata'
import { Descriptor } from '@kingjs/descriptor'
import { getOwn } from '@kingjs/get-own'
import { Attachments, AbstractAttachments } from '@kingjs/partial-attachments'
import {
  assertDescriptors,
} from '@kingjs/partial-declare'
import { PartialReflect } from '@kingjs/partial-reflect'
import {
  Declarative,
  Normalize,
  Procedurals,
  Self,
} from '@kingjs/partial-symbols'
import { PartialType } from '@kingjs/partial-type'

function *ownDeclarations(type, declaration) {
  yield* asMetadata(getOwn(type, Self))

  const procedurals = [...asMetadata(getOwn(type, Procedurals))]
  yield* procedurals

  const family = PartialType.getFamily(declaration)
  const symbol = family?.[Declarative]
  if (!symbol)
    return

  yield* asMetadata(getOwn(type, symbol))
}

function isSelfRequirement(type, declaration) {
  return [...asMetadata(getOwn(type, Self))].includes(declaration)
}

function isDeclared(type, declaration, seen = new Set()) {
  if (type == declaration)
    return true

  if (seen.has(type))
    return false
  seen.add(type)

  for (const partialType of ownDeclarations(type, declaration))
    if (partialType == declaration
      || isDeclared(partialType, declaration, seen))
      return true

  const base = Object.getPrototypeOf(type)
  return typeof base == 'function'
    && base != Function.prototype
    && isDeclared(base, declaration, seen)
}

function assertMutable(type) {
  const procedurals = getOwn(type, Procedurals)
  assert(procedurals == null || !Object.isFrozen(procedurals),
    'Type cannot be modified after it has been loaded.')
}

function assertComposedOf(type, declaration) {
  assert(isDeclared(type, declaration),
    `${type.name} must be composed of ${declaration.name}.`)
}

function formatKey(key) {
  return typeof key == 'symbol'
    ? key.toString()
    : key
}

function assertAbstractsAccountedFor(
  type,
  declaration,
  implementation,
  stillAbstract,
) {
  const isSelf = isSelfRequirement(type, declaration)

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

    if (implementationDescriptor || stillAbstractDescriptor)
      continue

    if (isSelf)
      continue

    if (typeDescriptor && !isAbstract(typeDescriptor))
      continue

    throw new Error(
      `${declaration.name} member '${formatKey(key)}' is not accounted for.`)
  }
}

function assertNoSelfStillAbstracts(type, declaration, stillAbstract) {
  if (!isSelfRequirement(type, declaration))
    return

  const keys = [...PartialReflect.ownKeys(stillAbstract)]
  assert(keys.length == 0,
    `${declaration.name} members are supplied by Self.`)
}

export function override(
  type,
  declaration,
  implementation = { },
  stillAbstract = { },
) {
  implementation = Attachments[Normalize](implementation)
  stillAbstract = AbstractAttachments[Normalize](stillAbstract)

  assertMutable(type)
  assertComposedOf(type, declaration)

  assertDescriptors(declaration, implementation)
  assertDescriptors(declaration, stillAbstract)
  assertNoSelfStillAbstracts(type, declaration, stillAbstract)
  assertAbstractsAccountedFor(
    type,
    declaration,
    implementation,
    stillAbstract,
  )

  for (const key of PartialReflect.ownKeys(implementation)) {
    const descriptor = PartialReflect.getOwnDescriptor(implementation, key)
    Object.defineProperty(type.prototype, key, descriptor)
  }
}
