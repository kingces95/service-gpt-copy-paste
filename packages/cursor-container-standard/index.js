import {
  ArrayMap,
  Deque,
  ForwardList,
  List,
  UnorderedMap,
  UnorderedSet,
  VectorOf,
} from '@kingjs/cursor-container'

export {
  ArrayMap,
  Deque,
  ForwardList,
  List,
  UnorderedMap,
  UnorderedSet,
}

export const Vector = VectorOf(Float64Array)
export const Int8Vector = VectorOf(Int8Array)
export const Uint8Vector = VectorOf(Uint8Array)
export const Uint8ClampedVector = VectorOf(Uint8ClampedArray)
export const Int16Vector = VectorOf(Int16Array)
export const Uint16Vector = VectorOf(Uint16Array)
export const Int32Vector = VectorOf(Int32Array)
export const Uint32Vector = VectorOf(Uint32Array)
export const Float32Vector = VectorOf(Float32Array)
export const Float64Vector = VectorOf(Float64Array)
export const BigInt64Vector = VectorOf(BigInt64Array)
export const BigUint64Vector = VectorOf(BigUint64Array)
