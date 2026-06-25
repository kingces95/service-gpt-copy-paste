import { assert } from '@kingjs/assert'
import { declareName } from '@kingjs/es6-define'
import {
  ArgChecks,
  Defaults,
  Preconditions,
  Signature,
  Transforms,
} from '@kingjs/partial-symbols'

const MetadataSymbols = {
  types: ArgChecks,
  defaults: Defaults,
  precondition: Preconditions,
  transforms: Transforms,
}

const SignatureKeys = Object.keys(MetadataSymbols)
const SlotKeys = [ 'method', 'get', 'set' ]

function metadataFor(type, symbol) {
  if (!Object.hasOwn(type, symbol)) {
    Object.defineProperty(type, symbol, {
      value: { },
      configurable: true,
    })
  }

  return type[symbol]
}

function declareMetadata(type, memberKey, metadata) {
  for (const metadataKey in metadata) {
    const symbol = MetadataSymbols[metadataKey]
    assert(symbol, `Unknown signature metadata: ${metadataKey}.`)

    metadataFor(type, symbol)[memberKey] = metadata[metadataKey]
  }
}

function name(fn, key) {
  if (fn.name == key) return fn

  Object.defineProperty(fn, 'name', {
    value: key,
    configurable: true,
  })

  return fn
}

function parseSignatureRecord(record) {
  assert(record && typeof record == 'object',
    'Signature record must be an object.')

  for (const key of Reflect.ownKeys(record))
    assert(SignatureKeys.includes(key) || SlotKeys.includes(key),
      `Unknown signature record member: ${key}.`)

  const slotKeys = SlotKeys.filter(key => key in record)
  assert(slotKeys.length == 1,
    'Signature record must define exactly one of method, get, or set.')

  const metadata = { }
  for (const key of SignatureKeys)
    if (key in record)
      metadata[key] = record[key]

  const slot = slotKeys[0]
  return { metadata, slot, fn: record[slot] }
}

function isSignatureRecord(value) {
  return value && typeof value == 'object'
    && SlotKeys.some(key => key in value)
}

function createDescriptor(slot, fn, key, { rename = true } = { }) {
  if (slot == 'method')
    return {
      value: rename ? declareName(fn, Signature) : fn,
      writable: true,
      enumerable: true,
      configurable: true,
    }

  return {
    [slot]: rename ? name(fn, key) : fn,
    enumerable: true,
    configurable: true,
  }
}

function lowerSignatureRecord(type, key, record) {
  const { metadata, slot, fn } = parseSignatureRecord(record)
  assert(typeof fn == 'function', `Signature ${slot} must be a function.`)

  declareMetadata(type, key, metadata)

  return createDescriptor(slot, fn, key)
}

export function members(type, pojo) {
  assert(typeof type == 'function', 'Signature type must be a type.')
  assert(pojo && typeof pojo == 'object',
    'Signature members must be an object.')

  const result = { }
  const descriptors = Object.getOwnPropertyDescriptors(pojo)

  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key]

    if ('value' in descriptor && isSignatureRecord(descriptor.value)) {
      Object.defineProperty(result, key, lowerSignatureRecord(
        type, key, descriptor.value))
      continue
    }

    Object.defineProperty(result, key, descriptor)
  }

  return result
}

export function signature(type, metadata, fn) {
  assert(typeof type == 'function', 'Signature type must be a type.')
  assert(metadata && typeof metadata == 'object',
    'Signature metadata must be an object.')
  assert(typeof fn == 'function', 'Signature target must be a function.')
  assert(fn.name, 'Signature target must be named.')

  declareMetadata(type, fn.name, metadata)
  return fn
}
