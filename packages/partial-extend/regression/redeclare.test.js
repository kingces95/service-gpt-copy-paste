import { describe, it, expect } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { extend } from '@kingjs/partial-extend'
import { PartialClass, Implements } from '@kingjs/partial-class'
import { Concept } from '@kingjs/partial-concept'

class SteppableConcept extends Concept {
  step() { }
}

class SteppablePart extends PartialClass {
  static [Implements] = SteppableConcept
}

describe('redeclared concept descriptors', () => {
  it('appear as own descriptors on implementing parts', () => {
    const descriptor = PartialReflect.getOwnDescriptor(SteppablePart, 'step')

    expect(descriptor.value).toBeInstanceOf(Function)
  })

  it('allow parts to implement concept members', () => {
    class Type {
      static {
        extend(this, SteppablePart, {
          step() { return this },
        })
      }
    }

    const instance = new Type()
    expect(instance.step()).toBe(instance)
  })

  it('rejects members not declared by the part or redeclared concepts', () => {
    expect(() => class Type {
      static {
        extend(this, SteppablePart, {
          unknown() { },
        })
      }
    }).toThrow('SteppablePart does not define member \'unknown\'.')
  })
})
