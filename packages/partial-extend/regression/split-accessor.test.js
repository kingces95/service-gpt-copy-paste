import { describe, it, expect } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { extend } from '@kingjs/partial-extend'
import { PartialClass } from '@kingjs/partial-class'

class ReadablePart extends PartialClass {
  get value() { }
}

class WritablePart extends PartialClass {
  static {
    extend(this, ReadablePart)
  }

  set value(value) { }
}

class Type {
  static {
    extend(this, WritablePart, {
      get value() { return this._value },
    })
  }
}

describe('split accessor ownership', () => {
  it('promotes an inherited getter alongside an own setter', () => {
    const descriptor = PartialReflect.getOwnDescriptor(WritablePart, 'value')

    expect(descriptor.get).toBeInstanceOf(Function)
    expect(descriptor.set).toBeInstanceOf(Function)
  })

  it('currently allows implementing the promoted getter', () => {
    const descriptor = Reflect.getOwnPropertyDescriptor(Type.prototype, 'value')

    expect(descriptor.get).toBeInstanceOf(Function)
    expect(descriptor.set).toBeInstanceOf(Function)
  })
})
