export function es6DefineType(name = null, base = Object, pojo = { }) {
  const [type] = [class extends base { }]
  
  Object.defineProperties(type, {
    name: {
      value: name,
      configurable: true,
      enumerable: false,
      writable: false,
    }
  })

  const prototype = type.prototype
  const descriptors = Object.getOwnPropertyDescriptors(pojo)
  delete descriptors.constructor
  Object.defineProperties(prototype, descriptors)

  return type
}