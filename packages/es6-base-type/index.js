export function es6BaseType(type) {
  if (type == null) return null

  // Special-case the root
  if (type === Object) return null

  // In JS, "no extends" shows up as Function.prototype on the constructor
  // (e.g., class MyClass {}  -> Object.getPrototypeOf(MyClass) === Function.prototype)
  const prototype = Object.getPrototypeOf(type)

  // If the constructor has no declared base, treat it as extending Object
  if (prototype === Function.prototype) return Object

  // Otherwise it's an explicit `extends <proto>`
  return prototype
}

