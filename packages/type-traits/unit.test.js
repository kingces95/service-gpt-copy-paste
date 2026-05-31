import { describe, it, expect } from 'vitest'
import {
  sameAs,
  extensionOf,
  derivedFrom,
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

  it('extensionOf excludes the same type', () => {
    expect(Derived).toBeInstanceOf(extensionOf(Base))
    expect(Base).not.toBeInstanceOf(extensionOf(Base))
    expect(Other).not.toBeInstanceOf(extensionOf(Base))
  })

  it('derivedFrom is an alias of extensionOf', () => {
    expect(Derived).toBeInstanceOf(derivedFrom(Base))
    expect(Base).not.toBeInstanceOf(derivedFrom(Base))
    expect(Other).not.toBeInstanceOf(derivedFrom(Base))
  })
})
