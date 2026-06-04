import { describe, expect, it } from 'vitest'
import { ConstructsOf } from '@kingjs/simple-type'
import {
  BigIntTypedArrayConstructorProbe,
  NumberTypedArrayConstructorProbe,
  TypedArrayConstructorProbe,
  TypedArrayProbe,
  typedArrayDefaultValueOf,
  typedArrayValueTypeOf,
} from '@kingjs/probe-typed-array'

const TypedArrayTypes = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
]

describe('TypedArrayConstructorProbe', () => {
  it.each(TypedArrayTypes)('accepts %s', TArray => {
    expect(TArray).toBeInstanceOf(TypedArrayConstructorProbe)
  })

  it('rejects non typed-array constructors', () => {
    expect(Array).not.toBeInstanceOf(TypedArrayConstructorProbe)
  })

  it('rejects DataView', () => {
    expect(DataView).not.toBeInstanceOf(TypedArrayConstructorProbe)
  })
})

describe('NumberTypedArrayConstructorProbe', () => {
  it('accepts number typed arrays', () => {
    expect(Uint8Array).toBeInstanceOf(NumberTypedArrayConstructorProbe)
  })

  it('rejects bigint typed arrays', () => {
    expect(BigInt64Array).not.toBeInstanceOf(NumberTypedArrayConstructorProbe)
  })
})

describe('BigIntTypedArrayConstructorProbe', () => {
  it('accepts bigint typed arrays', () => {
    expect(BigInt64Array).toBeInstanceOf(BigIntTypedArrayConstructorProbe)
  })

  it('rejects number typed arrays', () => {
    expect(Uint8Array).not.toBeInstanceOf(BigIntTypedArrayConstructorProbe)
  })
})

describe('TypedArrayProbe', () => {
  it.each(TypedArrayTypes)('accepts %s instances', TArray => {
    expect(new TArray(1)).toBeInstanceOf(TypedArrayProbe)
    expect(TArray.prototype).toBeInstanceOf(TypedArrayProbe)
  })

  it('rejects plain arrays', () => {
    expect([]).not.toBeInstanceOf(TypedArrayProbe)
  })

  it('supports constructor constraints through ConstructsOf', () => {
    const ConstructsTypedArray = ConstructsOf(TypedArrayProbe)
    expect(Uint8Array).toBeInstanceOf(ConstructsTypedArray)
    expect(Array).not.toBeInstanceOf(ConstructsTypedArray)
  })
})

describe('typedArrayValueTypeOf', () => {
  it('maps number typed arrays to Number', () => {
    expect(typedArrayValueTypeOf(Uint8Array)).toBe(Number)
    expect(typedArrayDefaultValueOf(Uint8Array)).toBe(0)
  })

  it('maps bigint typed arrays to BigInt', () => {
    expect(typedArrayValueTypeOf(BigInt64Array)).toBe(BigInt)
    expect(typedArrayDefaultValueOf(BigInt64Array)).toBe(0n)
  })
})
