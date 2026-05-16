import { describe, it, expect } from 'vitest'
import { templatize } from '@kingjs/templatize'

class Requirement {
  static [Symbol.hasInstance](value) {
    return value === Type
  }
}

class OtherRequirement {
  static [Symbol.hasInstance](value) {
    return value === OtherType
  }
}

class Type {
}

class OtherType {
}

describe('templatize', () => {
  it('should templatize a type', () => {
    class TemplateType {
    }

    templatize(TemplateType)

    const TemplateTypeOf = TemplateType.as(Type)

    expect(TemplateTypeOf.name).toBe('TemplateTypeOf')
    expect(TemplateTypeOf.targs).toEqual([Type])
    expect(Object.isFrozen(TemplateTypeOf.targs)).toBe(true)
    expect(TemplateType.prototype.isPrototypeOf(TemplateTypeOf.prototype))
      .toBe(true)
    expect('as' in TemplateTypeOf.as).toBe(false)
  })

  it('should cache type instantiations', () => {
    class TemplateType {
    }

    templatize(TemplateType)

    expect(TemplateType.as(Type)).toBe(TemplateType.as(Type))
    expect(TemplateType.as(Type)).not.toBe(TemplateType.as(OtherType))
  })

  it('should templatize a function', () => {
    const template = templatize(
      type => function value() { return type }
    )

    const fnOfType = template.as(Type)

    expect(fnOfType()).toBe(Type)
    expect(fnOfType.targs).toEqual([Type])
    expect(Object.isFrozen(fnOfType.targs)).toBe(true)
    expect(fnOfType.as).toBe(template.as)
  })

  it('should cache function instantiations', () => {
    const template = templatize(
      type => function value() { return type }
    )

    expect(template.as(Type)).toBe(template.as(Type))
    expect(template.as(Type)).not.toBe(template.as(OtherType))
  })

  it('should check type arguments using contract', () => {
    const template = templatize(
      [Requirement, OtherRequirement],
      (type, otherType) => function value() { return [type, otherType] }
    )

    expect(template.as(Type, OtherType)()).toEqual([Type, OtherType])
    expect(() => template.as(OtherType, Type)).toThrow(
      'Argument must be an instance of Requirement.')
  })

  it('should define template surface with strict descriptors', () => {
    const template = templatize(
      type => function value() { return type }
    )

    const fnOfType = template.as(Type)
    const as = Object.getOwnPropertyDescriptor(template, 'as')
    const targs = Object.getOwnPropertyDescriptor(fnOfType, 'targs')

    expect(as.writable).toBe(false)
    expect(as.enumerable).toBe(false)
    expect(as.configurable).toBe(false)
    expect(targs.writable).toBe(false)
    expect(targs.enumerable).toBe(false)
    expect(targs.configurable).toBe(false)
  })
})
