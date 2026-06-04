import { Probe } from '@kingjs/probe'

export class TypedArrayConstructorProbe extends Probe {
  static typeof = 'function'

  get BYTES_PER_ELEMENT() { }
  from() { }
  of() { }

  static hasInstance(type) {
    const instance = new type(1)
    return ArrayBuffer.isView(instance) && !(instance instanceof DataView)
  }
}

export class NumberTypedArrayConstructorProbe
  extends TypedArrayConstructorProbe {
  static hasInstance(type) {
    return typedArrayValueTypeOf(type) == Number
  }
}

export class BigIntTypedArrayConstructorProbe
  extends TypedArrayConstructorProbe {
  static hasInstance(type) {
    return typedArrayValueTypeOf(type) == BigInt
  }
}

export class TypedArrayProbe extends Probe {
  get buffer() { }
  get byteLength() { }
  get byteOffset() { }
  get length() { }

  at() { }
  copyWithin() { }
  fill() { }
  set() { }
  slice() { }
  subarray() { }

  [Symbol.iterator]() { }
}

export function typedArrayValueTypeOf(TArray) {
  const value = new TArray(1)[0]

  switch (typeof value) {
    case 'number': return Number
    case 'bigint': return BigInt
    default: throw new TypeError('Typed array value type is unknown.')
  }
}

export function typedArrayDefaultValueOf(TArray) {
  switch (typedArrayValueTypeOf(TArray)) {
    case BigInt: return 0n
    default: return 0
  }
}
