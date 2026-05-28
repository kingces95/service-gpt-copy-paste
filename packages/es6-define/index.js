export function declareName(target, value) {
  Object.defineProperty(target, 'name', nameDescriptor(value))
  return target
}

export function declareMethod(target, key, value) {
  Object.defineProperty(target, key, methodDescriptor(value))
  return target
}

export function declareGetter(target, key, get) {
  Object.defineProperty(target, key, getterDescriptor(get))
  return target
}

export function declareSetter(target, key, set) {
  Object.defineProperty(target, key, setterDescriptor(set))
  return target
}

export function declareField(target, key, value) {
  Object.defineProperty(target, key, fieldDescriptor(value))
  return target
}

export function declareMembers(target, pojo = { }) {
  const descriptors = Object.getOwnPropertyDescriptors(pojo)
  delete descriptors.constructor
  Object.defineProperties(target, descriptors)
  return target
}

export function declareType(name = null, base = Object, pojo = { }) {
  const [type] = [class extends base { }]

  declareName(type, name)
  declareMembers(type.prototype, pojo)

  return type
}

export function nameDescriptor(value) {
  return {
    value,
    writable: false,
    enumerable: false,
    configurable: true,
  }
}

export function methodDescriptor(value) {
  return {
    value,
    writable: true,
    enumerable: false,
    configurable: true,
  }
}

export function getterDescriptor(get) {
  return {
    get,
    enumerable: false,
    configurable: true,
  }
}

export function setterDescriptor(set) {
  return {
    set,
    enumerable: false,
    configurable: true,
  }
}

export function fieldDescriptor(value) {
  return {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  }
}
