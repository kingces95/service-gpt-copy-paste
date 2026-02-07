import { isAbstract } from '@kingjs/abstract'
import { es6CreateThunk } from '@kingjs/es6-create-thunk'
import { PartialReflect } from '@kingjs/partial-reflect'
import { FunctionBuilder } from '@kingjs/function-builder'

export const Compile = Symbol('PartialProxy.Compile')
export const Preconditions = Symbol('PartialProxy.Preconditions')
export const Postconditions = Symbol('PartialProxy.Postconditions')
export const TypePrecondition = Symbol('PartialProxy.TypePrecondition')
export const TypePostcondition = Symbol('PartialProxy.TypePostcondition')

export class PartialProxy {
  [Compile](type, key, descriptor) {
    if (isAbstract(descriptor)) return descriptor

    const {
      typePrecondition, 
      typePostcondition,
      precondition,
      postcondition,
    } = PartialProxyReflect

    const stub = es6CreateThunk(descriptor, { 
      typePrecondition: typePrecondition(type),
      typePostcondition: typePostcondition(type),
      precondition: precondition(type, key),
      postcondition: postcondition(type, key),
    })

    return stub
  }
}

export class PartialProxyReflect {
  static *conditionDescriptors$(type, key, symbol) {
    for (const host of PartialReflect.abstractHosts(type, key)) {
      const conditions = host[symbol]
      if (!conditions) continue

      const condition = PartialReflect.getDescriptor(conditions, key)
      if (!condition) continue

      yield condition
    }
  }
  static getConditions$(type, key, symbol) {
    const descriptors = 
      PartialProxyReflect.conditionDescriptors$(type, key, symbol)

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
  static precondition(type, key) {
    return PartialProxyReflect.getConditions$(type, key, Preconditions)
  }
  static postcondition(type, key) {
    return PartialProxyReflect.getConditions$(type, key, Postconditions)
  }
}