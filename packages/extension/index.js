import { assert } from '@kingjs/assert'
import { isPojo } from '@kingjs/pojo-test'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { Compiler } from '@kingjs/compiler'

const {
  get: getDescriptor,
} = Descriptor

const {
  memberNamesAndSymbols,
} = Reflection

export const Extensions = Symbol('PartialClassExtensions')
export const Compile = Symbol('PartialClassCompile')
export const Bind = Symbol('PartialClassBind')
export const Mark = Symbol('PartialClassMark')
export const PreCondition = Symbol('PartialClassPreCondition')
export const PostCondition = Symbol('PartialClassPostCondition')

export class Extension {
  static fromPojo$(pojo, extendedClass) {
    assert(isPojo(pojo))

    // define an anonymous extension
    const [anonymousExtension] = [class extends extendedClass { }]
    const prototype = anonymousExtension.prototype
    
    // copy descriptors from pojo to anonymous extension prototype
    for (const name of memberNamesAndSymbols(pojo)) {
      const descriptor = getDescriptor(pojo, name)
      Object.defineProperty(prototype, name, descriptor)
    }

    return anonymousExtension
  }

  constructor() {
    throw new TypeError('Extension cannot be instantiated.')
  }

  static get [Extensions]() { }
  static [Compile](descriptor) { return Compiler.compile(descriptor) }
  static [Bind](type, name, descriptor) { return descriptor }
  static [Mark](type) { }
  static [PreCondition](type, host) { }
  static [PostCondition](type) { }
}
