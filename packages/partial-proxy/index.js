import { isAbstract } from '@kingjs/abstract'
import { es6CreateThunk } from '@kingjs/es6-create-thunk'
import { PartialReflect } from '@kingjs/partial-reflect'
import { FunctionBuilder } from '@kingjs/function-builder'

export const Compile = Symbol('PartialProxy.Compile')
export const TypePrecondition = Symbol('PartialProxy.TypePrecondition')
export const TypePostcondition = Symbol('PartialProxy.TypePostcondition')
export const MemberPreconditions = Symbol('PartialProxy.MemberPreconditions')
export const MemberPostconditions = Symbol('PartialProxy.MemberPostconditions')

export class PartialProxy {
  [Compile](type, key, descriptor) {
    if (isAbstract(descriptor)) return descriptor

    const {
      typePrecondition, 
      typePostcondition,
      memberPrecondition,
      memberPostcondition,
    } = PartialProxyReflect

    const stub = es6CreateThunk(descriptor, { 
      typePrecondition: typePrecondition(type),
      typePostcondition: typePostcondition(type),
      memberPrecondition: memberPrecondition(type, key),
      memberPostcondition: memberPostcondition(type, key),
    })

    return stub
  }
}

export class PartialProxyReflect {
  static *#memberConditionDescriptors(type, key, symbol) {
    for (const host of PartialReflect.getHosts(type, key)) {
      const conditions = host[symbol]
      if (!conditions) continue

      const condition = PartialReflect.getDescriptor(conditions, key)
      if (!condition) continue

      yield condition
    }
  }
  static #getMemberConditionFns(type, key, symbol) {
    const descriptors = 
      PartialProxyReflect.#memberConditionDescriptors(type, key, symbol)

    return {
      value: FunctionBuilder.require(descriptors.map(o => o.value)),
      get: FunctionBuilder.require(descriptors.map(o => o.get)),
      set: FunctionBuilder.require(descriptors.map(o => o.set)),
    }
  }
  
  static isPartialProxy(type) {
    return type?.prototype instanceof PartialProxy
  }

  static typePrecondition(type) {
    return type[TypePrecondition]
  }
  static typePostcondition(type) {
    return type[TypePostcondition]
  }
  static memberPrecondition(type, key) {
    return PartialProxyReflect.#getMemberConditionFns(
      type, key, MemberPreconditions)
  }
  static memberPostcondition(type, key) {
    return PartialProxyReflect.#getMemberConditionFns(
      type, key, MemberPostconditions)
  }
}