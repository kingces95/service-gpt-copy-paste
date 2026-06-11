import { describe, expect, it } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'
import {
  BigInt64Vector,
  BigUint64Vector,
  Float32Vector,
  Float64Vector,
  Int8Vector,
  Int16Vector,
  Int32Vector,
  Uint8ClampedVector,
  Uint8Vector,
  Uint16Vector,
  Uint32Vector,
  Vector,
} from '@kingjs/cursor-container-standard'
import {
  VectorOf,
} from '@kingjs/cursor-container'

const TypedArrayTypes = [
  [Int8Array, Number, 0],
  [Uint8Array, Number, 0],
  [Uint8ClampedArray, Number, 0],
  [Int16Array, Number, 0],
  [Uint16Array, Number, 0],
  [Int32Array, Number, 0],
  [Uint32Array, Number, 0],
  [BigInt64Array, BigInt, 0n],
  [BigUint64Array, BigInt, 0n],
  [Float32Array, Number, 0],
  [Float64Array, Number, 0],
]

const VectorTypes = [
  [Int8Vector, Number, Int8Array],
  [Uint8Vector, Number, Uint8Array],
  [Uint8ClampedVector, Number, Uint8ClampedArray],
  [Int16Vector, Number, Int16Array],
  [Uint16Vector, Number, Uint16Array],
  [Int32Vector, Number, Int32Array],
  [Uint32Vector, Number, Uint32Array],
  [Float32Vector, Number, Float32Array],
  [Float64Vector, Number, Float64Array],
  [BigInt64Vector, BigInt, BigInt64Array],
  [BigUint64Vector, BigInt, BigUint64Array],
]

describe('Vector', () => {
  it('exposes a generic type specializer', () => {
    expect(typeof VectorOf).toBe('function')
    expect(() => new VectorOf()).toThrow()
  })

  it.each(TypedArrayTypes)(
    'accepts %s as an array type',
    (ArrayType, ValueType, defaultValue) => {
      const VectorType = VectorOf(ArrayType)
      const vector = new VectorType(3)

      vector.resize(3)

      expect(VectorType.valueType).toBe(ValueType)
      expect(VectorType.cursorType.spanType).toBe(ArrayType)
      expect(VectorType.defaultValue).toBe(defaultValue)
      expect(vector.capacity).toBe(3)
      expect(vector.span()).toBeInstanceOf(ArrayType)
      expect([...iterate(vector)]).toEqual([
        defaultValue,
        defaultValue,
        defaultValue,
      ])
    })

  it('caches named specializations by array type', () => {
    expect(VectorOf(Uint16Array)).toBe(Uint16Vector)
    expect(Uint16Vector.valueType).toBe(Number)
    expect(Uint16Vector.cursorType.spanType).toBe(Uint16Array)
  })

  it.each(VectorTypes)(
    'exposes %s for %s',
    (VectorType, ValueType, ArrayType) => {
      expect(VectorOf(ArrayType)).toBe(VectorType)
      expect(VectorType.valueType).toBe(ValueType)
      expect(VectorType.cursorType.spanType).toBe(ArrayType)
    })

  it('rejects non-typed-array constructors', () => {
    expect(() => VectorOf(Array)).toThrow(
      'Argument 0 must be TypedArrayConstructorProbe.')
  })

  it('uses typed arrays for capacity, indexing, and spans', () => {
    const vector = new Uint16Vector(3)

    vector.resize(3)
    vector.setAt(1, 42)

    expect(vector.capacity).toBe(3)
    expect(vector.at(1)).toBe(42)
    expect(vector.span()).toBeInstanceOf(Uint16Array)
    expect([...iterate(vector)]).toEqual([0, 42, 0])
  })

  it('keeps ergonomic aliases for common typed vectors', () => {
    expect(new Vector(2).span()).toBeInstanceOf(Float64Array)
    expect(new Float64Vector(2).span()).toBeInstanceOf(Float64Array)
    expect(new Uint8Vector(2).span()).toBeInstanceOf(Uint8Array)
  })
})
