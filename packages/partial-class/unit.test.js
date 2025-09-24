import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialClass, Extension, Extensions } from '@kingjs/partial-class'

describe('PartialClass', () => {
  it('cannot be instantiated', () => {
    expect(() => new PartialClass()).toThrow()
  })
})

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
    describe('converted by PartialClass.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = PartialClass.fromArg(extension)
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
    describe('converted by PartialClass.fromArg', () => {
      let arg
      beforeEach(() => {
        arg = PartialClass.fromArg(pojo)
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
  it('should yield no own declarations', () => {
    const declarations = [...PartialClass.getOwnDeclarations(type)]
    expect(declarations).toHaveLength(0)
  })
  describe('after begin extended by an Extension with a SubExtension', () => {
    let extension, subExtension
    beforeEach(() => {
      subExtension = class SubExtension extends Extension { }
      extension = class MyExtension extends Extension { 
        static [Extensions] = [ subExtension, subExtension ]
      }
      extension.defineOn(type)
    })
    it('should yield the extensions as an own PartialClass declaration', () => {
      const declarations = [...PartialClass.getOwnDeclarations(type)]
      expect(declarations).toHaveLength(2)
      expect(declarations).toContain(extension)
      expect(declarations).toContain(subExtension)
    })
  })
  describe('after begin extended by an extension with a member', () => {
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
  describe('after being extended by an extension', () => {
    let extension
    beforeEach(() => {
      extension = class MyExtension extends Extension { }
      extension.defineOn(type)
    })
    it('should yield the extension as an own PartialClass declaration', () => {
      const declarations = [...PartialClass.getOwnDeclarations(type)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(extension)
    })
    it('should yield the extension as an own Extension declaration', () => {
      const declarations = [...Extension.getOwnDeclarations(type)]
      expect(declarations).toHaveLength(1)
      expect(declarations[0]).toBe(extension)
    })
    it('should not yeild the extension as a MyPartialClass declaration', () => {
      const MyPartialClass = class extends PartialClass { }
      const declarations = [...MyPartialClass.getOwnDeclarations(type)]
      expect(declarations).toHaveLength(0)
    })
    describe('then used as a base class', () => {
      let derived
      beforeEach(() => {
        derived = class extends type { }
      })
      it('should not yield the extension as an own PartialClass declaration', () => {
        const declarations = [...PartialClass.getOwnDeclarations(derived)]
        expect(declarations).toHaveLength(0)
      })
      it('should yield the extension as a PartialClass declaration', () => {
        const declarations = [...PartialClass.getDeclarations(derived)]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(extension)
      })
      describe('which is also extended by an Extension', () => {
        beforeEach(() => {
          extension.defineOn(derived)
        })
        it('should yield the extension as own PartialClass declarations', () => {
          const declarations = [...PartialClass.getOwnDeclarations(derived)]
          expect(declarations).toHaveLength(1)
          expect(declarations[0]).toBe(extension)
        })
        it('should yield the extension once as a PartialClass declaration', () => {
          const declarations = [...PartialClass.getDeclarations(derived)]
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
    extension = class extends Extension { }
  })
  it('should have no own declarations', () => {
    const declarations = [...extension.ownDeclarations()]
    expect(declarations).toHaveLength(0)
  })
  it('should have no declarations', () => {
    const declarations = [...extension.declarations()]
    expect(declarations).toHaveLength(0)
  })
  it('should nave no own names or symbols', () => {
    const namesAndSymbols = [...extension.namesAndSymbols()]
    expect(namesAndSymbols).toHaveLength(0)
  })
  it('should have no names or symbols', () => {
    const namesAndSymbols = [...extension.namesAndSymbols()]
    expect(namesAndSymbols).toHaveLength(0)
  })
  describe('with a sub extension', () => {
    let subExtension
    beforeEach(() => {
      subExtension = class extends Extension { }
      extension[Extensions] = [ subExtension ]
    })
    it('should have the sub extension as an own declaration', () => {
      const declarations = [...extension.ownDeclarations()]
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
        const declarations = [...extension.ownDeclarations()]
        expect(declarations).toHaveLength(1)
        expect(declarations[0]).toBe(subExtension)
      })
      it('should have the sub sub extension as a declaration', () => {
        const declarations = [...extension.declarations()]
        expect(declarations).toHaveLength(2)
        expect(declarations[0]).toBe(subExtension)
        expect(declarations[1]).toBe(subSubExtension)
      })
      it('should not have the member as an own name or symbol', () => {
        const namesAndSymbols = [...extension.ownNamesAndSymbols()]
        expect(namesAndSymbols).toHaveLength(0)
      })
      it('should have the member as a name or symbol', () => {
        const namesAndSymbols = [...extension.namesAndSymbols()]
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
        it('should have not include the different member as a name or symbol', () => {
          const namesAndSymbols = [...extension.namesAndSymbols()]
          expect(namesAndSymbols).toHaveLength(1)
          expect(namesAndSymbols).toContain('member')
        })
        it('should include the different partial class as a declaration', () => {
          const declarations = [...extension.declarations()]
          expect(declarations).toHaveLength(3)
          expect(declarations).toContain(myPartialClass)
          expect(declarations).toContain(subExtension)
          expect(declarations).toContain(subSubExtension)
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
      const namesAndSymbols = [...extension.ownNamesAndSymbols()]
      expect(namesAndSymbols).toHaveLength(1)
      expect(namesAndSymbols[0]).toBe('member')
    })
    it('should have the member as a name or symbol', () => {
      const namesAndSymbols = [...extension.namesAndSymbols()]
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
      const namesAndSymbols = [...extension.ownNamesAndSymbols()]
      expect(namesAndSymbols).toHaveLength(1)
      expect(namesAndSymbols[0]).toBe(symbol)
    })
  })
})

describe('A custom MyPartialClass applied to a type', () => {
  let myType
  let myMethod
  let MyPartialClass
  let MyDeclarationSymbol = Symbol('MyDeclaration')
  let MySubExtension
  let MyExtension 
  let preConditionCalled, compileCalled, bindCalled, postConditionCalled

  beforeEach(() => {
    preConditionCalled = false
    compileCalled = false
    bindCalled = false
    postConditionCalled = false

    MyPartialClass = class extends PartialClass { 
      static *[PartialClass.Symbol.ownDeclarations]() {
        yield *this[PartialClass.Private.fromDeclaration](MyDeclarationSymbol)
      }
    }

    myMethod = function() { }

    MySubExtension = class extends MyPartialClass { }
    MySubExtension.prototype.method = myMethod

    MyExtension = class extends MyPartialClass { 
      static [MyDeclarationSymbol] = [ MySubExtension ]
    }

    myType = class { }
  })

  describe('with a bind the returns null', () => {
    beforeEach(() => {
      MyPartialClass[PartialClass.Symbol.bind] = function(
        type$, name, descriptor) {
        expect(type$).toBe(myType)
        expect(name).toBe('method')
        expect(descriptor.value).toBe(myMethod)
        return null
      }

      MyExtension.defineOn(myType)
    })

    it('should skip the member', () => {
      expect(myType.prototype.method).toBeUndefined()
    })
  })

  describe('with kitchen sink callbacks', () => { 
    beforeEach(() => {
      MyPartialClass[PartialClass.Symbol.preCondition] = function(type) {
        preConditionCalled = true
        expect(compileCalled).toBeFalsy()
        expect(bindCalled).toBeFalsy()
        expect(postConditionCalled).toBeFalsy() 
        expect(type).toBe(myType)
      }

      MyPartialClass[PartialClass.Symbol.compile] = function(descriptor) {
        compileCalled = true
        expect(preConditionCalled).toBeTruthy()
        expect(bindCalled).toBeFalsy()
        expect(postConditionCalled).toBeFalsy() 
        expect(descriptor.value).toBe(myMethod)

        expect(descriptor.enumerable).toBe(true)
        descriptor.enumerable = false
        return descriptor 
      }

      MyPartialClass[PartialClass.Symbol.bind] = function(type, key, descriptor) {
        bindCalled = true
        expect(preConditionCalled).toBeTruthy()
        expect(compileCalled).toBeTruthy()
        expect(postConditionCalled).toBeFalsy()
        expect(type).toBe(myType)
        expect(key === 'method')
        expect(descriptor.value).toBe(myMethod)

        expect(descriptor.enumerable).toBe(false)
        return descriptor 
      }

      MyPartialClass[PartialClass.Symbol.postCondition] = function(type) {
        postConditionCalled = true
        expect(preConditionCalled).toBeTruthy()
        expect(compileCalled).toBeTruthy()
        expect(bindCalled).toBeTruthy()
        expect(type).toBe(myType)
      }
  
      MyExtension.defineOn(myType)
    })
    it('should have the method', () => {
      expect(myType.prototype.method).toBe(myMethod)
    })
    it('should call all PartialClass callbacks', () => {
      expect(preConditionCalled).toBe(true)
      expect(compileCalled).toBe(true)
      expect(bindCalled).toBe(true)
      expect(postConditionCalled).toBe(true)
    })
  })
})