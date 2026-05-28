import { describe, it, expect } from 'vitest'
import { Abstracts, PartialClass } from '@kingjs/partial-class'
import { Attachments } from '@kingjs/partial-attachments'
import { ApplyDeclaration } from '@kingjs/partial-declare'

class MethodPart extends PartialClass {
  method() { }
}

class PropertyPart extends PartialClass {
  get value() { }
  set value(value) { }
}

class AbstractPropertyPart extends PartialClass {
  static [Abstracts] = {
    get value() { },
    set value(value) { },
  }
}

class ReadOnlyPart extends PartialClass {
  get value() { }
}

describe('ApplyDeclaration', () => {
  it('accepts owned members', () => {
    class Type { }

    expect(() => {
      ApplyDeclaration.as(PartialClass, Attachments)(Type, MethodPart, {
        method() { }
      })
    }).not.toThrow()
  })

  it('rejects unknown members', () => {
    class Type { }

    expect(() => {
      ApplyDeclaration.as(PartialClass, Attachments)(Type, MethodPart, {
        other() { }
      })
    }).toThrow("MethodPart does not define member 'other'.")
  })

  it('rejects unsupported descriptor forms', () => {
    class Type { }

    expect(() => {
      ApplyDeclaration.as(PartialClass, Attachments)(Type, MethodPart, {
        get method() { return () => { } }
      })
    }).toThrow("MethodPart does not support member 'method'.")
  })

  it('rejects mutable fields for read-only declarations', () => {
    class Type { }

    expect(() => {
      ApplyDeclaration.as(PartialClass, Attachments)(Type, ReadOnlyPart, {
        value: 1,
      })
    }).toThrow("ReadOnlyPart does not support member 'value'.")
  })

  it('accepts accessor halves supported by a property descriptor', () => {
    class Type { }

    expect(() => {
      ApplyDeclaration.as(PartialClass, Attachments)(Type, PropertyPart, {
        get value() { return this._value }
      })
    }).not.toThrow()

    const descriptor = Object.getOwnPropertyDescriptor(Type.prototype, 'value')
    expect(descriptor.get).toBeInstanceOf(Function)
    expect(descriptor.set).toBeInstanceOf(Function)
  })

  it('accounts for split abstract accessors', () => {
    class Type { }

    expect(() => {
      ApplyDeclaration.as(PartialClass, Attachments)(Type, AbstractPropertyPart, {
        get value() { return this._value },
      }, {
        set value(value) { },
      })
    }).not.toThrow()

    const descriptor = Object.getOwnPropertyDescriptor(Type.prototype, 'value')
    expect(descriptor.get.call({ _value: 1 })).toBe(1)
    expect(() => descriptor.set()).toThrow('Abstract member not implemented')
  })
})
