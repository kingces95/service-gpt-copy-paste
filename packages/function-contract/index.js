import { assert } from '@kingjs/assert'
import { Preconditions } from '@kingjs/partial-symbols'

export { Preconditions } from '@kingjs/partial-symbols'

export class Check extends null {
  constructor() {
    throw new TypeError('Check cannot be instantiated.')
  }

  static isCheck(type) {
    if (typeof type != 'function') return false
    return type == Check || type.prototype instanceof Check
  }

  static check(value, args) { }
}

function isProceduralCheck(check) {
  return typeof check == 'function' && !check.prototype
}

function runCheck(check, value, args) {
  if (check == null) return

  if (Array.isArray(check)) {
    for (const current of check)
      runCheck(current, value, args)
    return
  }

  if (Check.isCheck(check)) {
    check.check(value, args)
    return
  }

  if (isProceduralCheck(check)) {
    check(value, args)
    return
  }

  if (typeof check == 'function') {
    if (value instanceof check) return
    throw new TypeError(
      `Argument must be an instance of ${check.name}.`)
  }

  throw new TypeError('Invalid precondition metadata.')
}

function runPreconditions(preconditions, args) {
  if (preconditions == null) return

  assert(Array.isArray(preconditions),
    'Function preconditions must be an array.')

  for (let i = 0; i < preconditions.length; i++)
    runCheck(preconditions[i], args[i], args)
}

function applyDefaults(args, defaults) {
  if (defaults == null) return args

  const result = [...args]

  for (let i = 0; i < defaults.length; i++) {
    if (result[i] !== undefined) continue
    if (defaults[i] === undefined) continue

    result[i] = defaults[i]
  }

  return result
}

export function contract(
  preconditions, 
  defaults = null, 
  fn = () => { }) {
  assert(typeof fn == 'function',
    'Argument must be a function.')

  if (typeof defaults == 'function') {
    fn = defaults
    defaults = null
  }

  const result = function(...args) {
    args = applyDefaults(args, defaults)
    runPreconditions(preconditions, args)
    return fn.apply(this, args)
  }

  Object.defineProperty(result, 'name', {
    value: fn.name,
    configurable: true,
  })

  return result
}
