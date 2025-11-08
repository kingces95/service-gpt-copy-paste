import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialClass } from '@kingjs/partial-class'
import { Extension, ExtensionReflect, Extensions } from '@kingjs/extension'

describe('A method', () => {
  let method
  beforeEach(() => {
    method = function method() { }
  })
  describe('on an Extension', () => {
    let extension
    beforeEach(() => {
      extension = class extends Extension { }
      extension.prototype.method = method
    })
    describe('converted by Extension.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = Extension.fromArg(extension)
      })
      it('should be the extension class', () => {
        expect(arg).toBe(extension)
      })
    })
  })
  describe('on a pojo', () => {
    let pojo
    beforeEach(() => {
      pojo = { method }
    })
    describe('converted by Extension.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = Extension.fromArg(pojo)
      })
      it('should be a type that extends Extension', () => {
        expect(arg.prototype).toBeInstanceOf(Extension)
      })
      it('should have the method', () => {
        expect(arg.prototype.method).toBe(method)
      })
    })
    describe('converted by Extension.fromPojo', () => {
      let extension
      beforeEach(() => {
        extension = Extension.fromPojo(pojo)
      })
      it('should be a type that extends Extension', () => {
        expect(extension.prototype).toBeInstanceOf(Extension)
      })
      it('should have the method', () => {
        expect(extension.prototype.method).toBe(method)
      })
    })
  })
})

describe('A type', () => {
  let type
  beforeEach(() => {
    type = class { }
  })
  it('should yield no own extensions', () => {
    const declarations = [...ExtensionReflect.ownExtensions(type)]
    expect(declarations).toHaveLength(0)
  })
  describe('after being extended by an Extension with a SubExtension', () => {
    let extension, subExtension
    beforeEach(() => {
      subExtension = class SubExtension extends Extension { }
      extension = class MyExtension extends Extension { 
        static [Extensions] = [ subExtension, subExtension ]
      }
      extension.defineOn(type)
    })
    it('should yield the extensions', () => {
      const declarations = [...ExtensionReflect.ownExtensions(type)]
      expect(declarations).toHaveLength(2)
      expect(declarations).toContain(extension)
      expect(declarations).toContain(subExtension)
    })
  })
  describe('after being extended by an extension with a member', () => {
    let extension, member
    beforeEach(() => {
      member = function member() { }
      extension = class MyExtension extends Extension { }
      extension.prototype.member = member
      extension.defineOn(type)
    })
    it('should have the member', () => {
      expect(type.prototype.member).toBe(member)
    })
  })
  describe('after being extended by an empty extension', () => {
    let extension
    beforeEach(() => {
      extension = class MyExtension extends Extension { }
      extension.defineOn(type)
    })
    it('should yield the extension as an own Extension declaration', () => {
      const declarations = [...ExtensionReflect.ownExtensions(type)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(extension)
    })
    describe('then used as a base class', () => {
      let derived
      beforeEach(() => {
        derived = class extends type { }
      })
      it('should yield the extension', () => {
        const declarations = [...ExtensionReflect.extensions(derived)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(extension)
      })
      describe('which is also extended by an Extension', () => {
        beforeEach(() => {
          extension.defineOn(derived)
        })
        it('should yield the extension as own', () => {
          const declarations = [...ExtensionReflect.ownExtensions(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
        it('should yield the extension', () => {
          const declarations = [...ExtensionReflect.extensions(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
      })
    })
  })
})

describe('An extension', () => {
  let extension
  beforeEach(() => {
    extension = class MyExtension extends Extension { }
  })
  it('should have no own declarations', () => {
    const declarations = [...ExtensionReflect.ownExtensions(extension)]
    expect(declarations).toHaveLength(0)
  })
  it('should have no declarations', () => {
    const declarations = [...ExtensionReflect.extensions(extension)]
    expect(declarations).toHaveLength(0)
  })
  it('should nave no own names or symbols', () => {
    const namesAndSymbols = [...ExtensionReflect.ownMemberKeys(extension)]
    expect(namesAndSymbols).toHaveLength(0)
  })
  it('should have no names or symbols', () => {
    const namesAndSymbols = [...ExtensionReflect.memberKeys(extension)]
    expect(namesAndSymbols).toHaveLength(0)
  })
  describe('with a sub extension', () => {
    let subExtension
    beforeEach(() => {
      subExtension = class extends Extension { }
      extension[Extensions] = [ subExtension ]
    })
    it('should have the sub extension as an own declaration', () => {
      const declarations = [...ExtensionReflect.ownExtensions(extension)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(subExtension)
    })
    describe('that also has a sub extension with a member', () => {
      let subSubExtension
      let subSubMember
      beforeEach(() => {
        subSubMember = function member() { }
        subSubExtension = class extends Extension { }
        subExtension[Extensions] = [ subSubExtension ]
        subSubExtension.prototype.member = subSubMember
      })
      it('should not have the sub sub extension as an own declaration', () => {
        const declarations = [...ExtensionReflect.ownExtensions(extension)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(subExtension)
      })
      it('should have the sub sub extension as a declaration', () => {
        const declarations = [...ExtensionReflect.extensions(extension)]
        expect(declarations).toHaveLength(2)
        expect(declarations[0]).toBe(subExtension)
        expect(declarations[1]).toBe(subSubExtension)
      })
      it('should not have the member as an own name or symbol', () => {
        const namesAndSymbols = [...ExtensionReflect.ownMemberKeys(extension)]
        expect(namesAndSymbols).toHaveLength(0)
      })
      it('should have the member as a name or symbol', () => {
        const namesAndSymbols = [...ExtensionReflect.memberKeys(extension)]
        expect(namesAndSymbols).toHaveLength(1)
        expect(namesAndSymbols[0]).toBe('member')
      })
      describe('and a MyPartialClass with a different member', () => {
        let MyPartialClass, myPartialClass, myMember
        beforeEach(() => {
          myMember = function member() { }
          MyPartialClass = class extends PartialClass { }
          myPartialClass = class extends MyPartialClass { }
          myPartialClass.prototype.differentMember = myMember
          extension[Extensions].push(myPartialClass)
        })
        it('should assert that MyPartialClass is not an Extension', () => {
          expect(() => {
            [...ExtensionReflect.extensions(extension)]
          }).toThrow(`Expected associated type "myPartialClass" to be a Extension.`)
        })
      })
    })
  })
  describe('that defines a member', () => {
    let member
    beforeEach(() => {
      member = function member() { }
      extension.prototype.member = member
    })
    it('should have the member as an own name or symbol', () => {
      const namesAndSymbols = [...ExtensionReflect.ownMemberKeys(extension)]
      expect(namesAndSymbols).toHaveLength(1)
      expect(namesAndSymbols[0]).toBe('member')
    })
    it('should have the member as a name or symbol', () => {
      const namesAndSymbols = [...ExtensionReflect.memberKeys(extension)]
      expect(namesAndSymbols).toHaveLength(1)
      expect(namesAndSymbols[0]).toBe('member')
    })
  })
  describe('that defines a symbolic member', () => {
    let symbol, member
    beforeEach(() => {
      symbol = Symbol('member')
      member = function member() { }
      extension.prototype[symbol] = member
    })
    it('should have the symbolic member as an own name or symbol', () => {
      const namesAndSymbols = [...ExtensionReflect.ownMemberKeys(extension)]
      expect(namesAndSymbols).toHaveLength(1)
      expect(namesAndSymbols[0]).toBe(symbol)
    })
  })
})
