import { describe, it, expect } from 'vitest'
import {
  sameAs,
  extensionOf,
  derivedFrom,
  baseOf,
} from '@kingjs/type-traits'

class Base {
}

class Derived extends Base {
}

class Other {
}

describe('type traits', () => {
  it('sameAs matches the same type', () => {
    expect(Base).toBeInstanceOf(sameAs(Base))
    expect(Derived).not.toBeInstanceOf(sameAs(Base))
  })

  it('extensionOf includes the base type by default', () => {
    expect(Derived).toBeInstanceOf(extensionOf(Base))
    expect(Base).toBeInstanceOf(extensionOf(Base))
    expect(Other).not.toBeInstanceOf(extensionOf(Base))
  })

  it('extensionOf can be strict', () => {
    expect(Derived).toBeInstanceOf(extensionOf(Base, { strict: true }))
    expect(Base).not.toBeInstanceOf(extensionOf(Base, { strict: true }))
  })

  it('derivedFrom is an alias of extensionOf', () => {
    expect(Derived).toBeInstanceOf(derivedFrom(Base))
    expect(Base).toBeInstanceOf(derivedFrom(Base))
    expect(Other).not.toBeInstanceOf(derivedFrom(Base))
  })

  it('baseOf includes the base type', () => {
    expect(Base).toBeInstanceOf(baseOf(Base))
    expect(Derived).toBeInstanceOf(baseOf(Base))
  })
})
