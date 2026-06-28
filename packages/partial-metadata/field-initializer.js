import { assert } from '@kingjs/assert'
import { getOwn } from '@kingjs/get-own'
import { Fields, Initializer } from '@kingjs/partial-symbols'

const Initialized = Symbol('PartialClass.Initialized')

function formatKey(key) {
  return typeof key == 'symbol'
    ? key.toString()
    : `'${key}'`
}

function initializedOf(self) {
  if (!Object.hasOwn(self, Initialized))
    Object.defineProperty(self, Initialized, {
      value: new Set(),
      configurable: true,
    })

  const initialized = self[Initialized]
  assert(initialized instanceof Set,
    'PartialClass initialized field must be a Set.')
  return initialized
}

function initializeFields(self, part, fields, args = null) {
  assert(fields && typeof fields == 'object',
    'PartialClass fields must be an object.')

  const initialized = initializedOf(self)
  if (initialized.has(part))
    return

  for (const key of Reflect.ownKeys(fields)) {
    const value = fields[key]
    if (value !== undefined && !Object.hasOwn(self, key))
      self[key] = value
  }

  if (args)
    part[Initializer]?.call(self, ...args)

  for (const key of Reflect.ownKeys(fields)) {
    if (fields[key] !== undefined)
      continue

    assert(
      Object.hasOwn(self, key),
      `${part.name} field ${formatKey(key)} not initialized.`
    )
  }

  initialized.add(part)
}

export function initialize(self, part, ...args) {
  initializeFields(self, part, getOwn(part, Fields), args)
}

export function createFieldInitializer(part, fields) {
  return function initializePartFields() {
    initializeFields(this, part, fields)
  }
}
