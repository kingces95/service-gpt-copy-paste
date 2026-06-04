import {
  ArrayMapOf,
  DequeOf,
  ForwardListOf,
  ListOf,
  UnorderedMapOf,
  UnorderedSetOf,
  VectorOf,
} from '@kingjs/cursor-container'

export const ForwardList = ForwardListOf(Object)
export const List = ListOf(Object)
export const Deque = DequeOf(Object)
export const ArrayMap = ArrayMapOf(Object)
export const UnorderedSet = UnorderedSetOf(Object)
export const UnorderedMap = UnorderedMapOf(Object, Object)

export const Vector = VectorOf(Number, Float64Array)
export const Int8Vector = VectorOf(Number, Int8Array)
export const Uint8Vector = VectorOf(Number, Uint8Array)
export const Uint8ClampedVector = VectorOf(Number, Uint8ClampedArray)
export const Int16Vector = VectorOf(Number, Int16Array)
export const Uint16Vector = VectorOf(Number, Uint16Array)
export const Int32Vector = VectorOf(Number, Int32Array)
export const Uint32Vector = VectorOf(Number, Uint32Array)
export const Float32Vector = VectorOf(Number, Float32Array)
export const Float64Vector = VectorOf(Number, Float64Array)
export const BigInt64Vector = VectorOf(BigInt, BigInt64Array)
export const BigUint64Vector = VectorOf(BigInt, BigUint64Array)
