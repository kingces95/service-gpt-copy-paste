import { describe, it, expect } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { extend } from '@kingjs/partial-extend'
import { PartialClass } from '@kingjs/partial-class'

class ReadablePart extends PartialClass {
  get value() { }
}

class WritablePart extends PartialClass {
  set value(value) { }
}

class ReadWritePart extends PartialClass {
  static {
    extend(this, ReadablePart)
    extend(this, WritablePart)
  }
}

class Type {
  static {
    extend(this, ReadablePart, {
      get value() { return this._value },
    })

    extend(this, WritablePart, {
      set value(value) { this._value = value },
    })
  }
}

describe('split accessor ownership', () => {
  it('reflects inherited accessor halves separately', () => {
    const descriptors = [...PartialReflect.findDescriptors(
      ReadWritePart, 'value')]
      .filter(current => typeof current == 'object')

    expect(descriptors[0].set).toBeInstanceOf(Function)
    expect(descriptors[0].get).toBeUndefined()
    expect(descriptors[1].get).toBeInstanceOf(Function)
    expect(descriptors[1].set).toBeUndefined()
  })

  it('merges accessor halves implemented through owning parts', () => {
    const descriptor = Reflect.getOwnPropertyDescriptor(Type.prototype, 'value')

    expect(descriptor.get).toBeInstanceOf(Function)
    expect(descriptor.set).toBeInstanceOf(Function)
  })

  it('rejects implementing an inherited accessor half', () => {
    expect(() => extend(class { }, ReadWritePart, {
      get value() { return this._value },
    })).toThrow("ReadWritePart does not define member 'value'.")
  })
})
