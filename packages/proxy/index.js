import { Reflection } from '@kingjs/reflection'

function isPublic(property) {
  const type = typeof property
  if (type === 'symbol') return true
  if (property.endsWith('$')) return false
  if (property.startsWith('_')) return false
  return true
}

function hasGetter(descriptor) {
  return descriptor && typeof descriptor.get === 'function'
}

function hasSetter(descriptor) {
  return descriptor && typeof descriptor.set === 'function'
}

// a global precondition function that is called when a public property 
// is accessed. This is sutible for checking if the instance is stale or 
// disposed or any precondition that is independent of arguments.
export const GlobalPrecondition = Symbol('GlobalPrecondition')

// Create a proxy for the target object that applies preconditions to a filtered
// set of properties. The proxy assumes that if a property returns a function it
// will be invoked at the callsite. For this reason, the target should not have
// properties that return functions that are not meant to be called (e.g. types).
export function createProxy(target, {
  // An object of preconditions called when matching properties are accessed. 
  // If the precondition returns a function, then a new function composed of 
  // the precondition and the actual function is returned. 
  preconditions = { },
  filter = isPublic,
}) {
  // if no preconditions are provided, return the target as is
  if (!preconditions) return target

  // extract the global precondition, if it exists
  const globalPrecondition = preconditions[GlobalPrecondition]

  return new Proxy(target, {
    get(target, property, receiver) {
      // known properties
      if (property === 'constructor') return target.constructor

      // precondition check
      if (filter(property)) globalPrecondition?.call(receiver)

      // ignore preconditions for symbol properties
      const descriptor = typeof property === 'symbol' ? null :
        Reflection.getDescriptor(preconditions, property)
      
      const precondition = descriptor?.value
      if (typeof precondition === 'function') {
        // property is a function with a precondition
        return (...args) => {
          precondition.call(receiver, ...args)
          return target[property].call(receiver, ...args)
        }
      }

      if (hasGetter(descriptor))
        // property is a getter with a precondition, execute the precondition
        Reflect.get(preconditions, property, receiver)
      
      // transparently return the property value or function
      let value = Reflect.get(target, property, receiver)
      if (typeof value === 'function')
        value = value.bind(receiver)
      return value
    },
    set(target, property, value, receiver) {
      if (filter(property)) globalPrecondition?.call(receiver)

      // if the property has a set thunk, use it
      const descriptor = Reflection.getDescriptor(preconditions, property)
      if (hasSetter(descriptor))
        Reflect.set(preconditions, property, value, receiver)

      Reflect.set(target, property, value, receiver)
      return true
    }
  })
}
