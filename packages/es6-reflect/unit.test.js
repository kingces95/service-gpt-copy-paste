import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Reflect } from '@kingjs/es6-reflect'
import { Prototype } from '@kingjs/prototype'

describe('Es6Reflect', () => {
  it('should return false if isExtensionOf is called with null type', () => {
    const result = Es6Reflect.isExtensionOf(null, Object)
    expect(result).toBe(false)
  })
  it('should return false if isExtensionOf is called with null expectedType', () => {
    const result = Es6Reflect.isExtensionOf(Object, null)
    expect(result).toBe(false)
  })
  it('should return false if isExtensionOf is called with non-function type', () => {
    const result = Es6Reflect.isExtensionOf({}, Object)
    expect(result).toBe(false)
  })
})

describe('Composition', () => {
  
  const ObjectTest = {
    name: 'Object',
    type: Object,
    componentType: null,
    components: [],
    extendedType: null,
    composition: [Object],
    extensions: [ 
      Object 
    ],
  }
  
  const FunctionTest = {
    name: 'Function',
    type: Function,
    componentType: Object,
    components: [Object],
    extendedType: Object,
    composition: [Function, Object],
    extensions: [ 
      Function, 
      Object 
    ],
  }
  
  class MyClass { }
  class MyClassExtendsNull extends null { }
  class MyClassEntendsObject extends Object { }
  class MyExtendedClass extends MyClass { }
  
  const MyClassTest = {
    name: 'MyClass',
    type: MyClass,
    componentType: Object,
    components: [Object],
    extendedType: Object,
    composition: [MyClass, Object],
    extensions: [ 
      MyClass, 
      Object 
    ]
  }
  
  const MyClassExtendsNullTest = {
    name: 'MyClassExtendsNull',
    type: MyClassExtendsNull,
    componentType: null,
    isAbstract: true,
    components: [],
    extendedType: null,
    composition: [MyClassExtendsNull],
    extensions: [ 
      MyClassExtendsNull
    ]
  }
  
  const MyClassEntendsObjectTest = {
    name: 'MyClassEntendsObject',
    type: MyClassEntendsObject,
    componentType: Object,
    components: [Object],
    extendedType: Object,
    composition: [MyClassEntendsObject, Object],
    extensions: [ 
      MyClassEntendsObject, 
      Object
    ],
    explicitlyExtendsObject: true,
  }
  
  const MyExtendedClassTest = {
    name: 'MyExtendedClass',
    type: MyExtendedClass,
    componentType: MyClass,
    components: [MyClass, Object],
    extendedType: MyClass,
    extendedX2Type: Object,
    composition: [MyExtendedClass, MyClass, Object],
    extensions: [ 
      MyExtendedClass, 
      MyClass, 
      Object 
    ]
  }
  
  const tests = [
    // [NullTest.name, NullTest],
    [ObjectTest.name, ObjectTest],
    [FunctionTest.name, FunctionTest],
    [MyClassTest.name, MyClassTest],
    [MyClassExtendsNullTest.name, MyClassExtendsNullTest],
    [MyClassEntendsObjectTest.name, MyClassEntendsObjectTest],
    [MyExtendedClassTest.name, MyExtendedClassTest]
  ]
  
  describe.each(tests)('%s', (_, {
    type, componentType, components, isAbstract, extendedType, extendedX2Type,
    composition, extensions, explicitlyExtendsObject
  }) => {
    it(`should have correct component`, () => {
      const result = Es6Reflect.getComponent(type)
      expect(result).toBe(componentType)
    })
    it(`should have correct components`, () => {
      const result = [...Es6Reflect.components(type)]
      expect(result).toEqual(components || [])
    })
    it('should have correct isAbstract result', () => {
      const expected = !!isAbstract
      const actual = Es6Reflect.isAbstract(type)
      expect(actual).toBe(expected)
    })
    it('should have correct extended type', () => {
      const result = Es6Reflect.getExtendedType(type)
      expect(result).toBe(extendedType)
    })
    it('should not be extension of itself', () => {
      const result = Es6Reflect.isExtensionOf(type, type)
      expect(result).toBe(false)
    })
    it('should have the correct composition', () => {
      const result = [...Es6Reflect.composition(type)]
      expect(result).toEqual(composition || [])
    })
    it('should report prototype extension by reflected composition', () => {
      for (const current of composition.slice(1))
        expect(Es6Reflect.isComposedOf(type, current)).toBe(true)

      expect(Es6Reflect.isComposedOf(type, type)).toBe(false)
    })
    if (extendedType) {
      it('should be extension of extended type', () => {
        const result = Es6Reflect.isExtensionOf(type, extendedType)
        expect(result).toBe(true)
      })    
    }
    if (extendedX2Type) {
      it('should be extension of extended2x type', () => {
        if (!extendedX2Type) return
        const result = Es6Reflect.isExtensionOf(type, extendedX2Type)
        expect(result).toBe(true)
      })
    }
    if (componentType) {
      it('should be able to duck cast to component', () => {
        const instance = new type()
        const canDuckCast = Es6Reflect.canDuckCast(componentType, instance)
        expect(canDuckCast).toBe(true)
      })
      it('should return self when composition is filtered by componentType', () => {
        const result = [...Es6Reflect.composition(type, { filter: componentType })]
        expect(result).toEqual([type])
      })
    }
    if (isAbstract) {
      it('should return no composition if filtered by Object', () => {
        if (!isAbstract) return
        const result = [...Es6Reflect.composition(type, { filter: Object })]
        expect(result).toEqual([])
      })
      it('should return no component if filtered by Object', () => {
        if (!isAbstract) return
        const result = Es6Reflect.getComponent(type, { filter: Object })
        expect(result).toBe(null)
      })
    }
    it('should have the correct extensions', () => {
      const actual = [...Es6Reflect.extensions(type)]
      expect(actual).toEqual(extensions)
    })
    it('should have correct static prototype', () => {
      const expectedChain = [...extensions]
      const actualChain = [...Prototype.deconstruct(
        Es6Reflect.getPrototype(type, { isStatic: true }))]
      
      expect(actualChain.length).toBe(expectedChain.length)
  
      let actualLink = null
      let expectedLink = expectedChain.shift()
      do { 
        actualLink = actualChain.shift()
  
        // The actual and expected descriptors match except for constructor. 
        const actualDescriptors = 
          Object.getOwnPropertyDescriptors(actualLink)
        const expectedDescriptors = 
          Object.getOwnPropertyDescriptors(expectedLink)
  
        // The constructor property is repurposed to point to the type 
        // from which the static members were copied. This mimics 
        // the Es6 prototype chain and is what allows using the Es6 
        // prototype chain reflection ergonomics on the static prototype 
        // chain.
        expect(expectedLink.constructor).toBe(Function)
        expect(actualLink.constructor).toBe(expectedLink)
        delete actualDescriptors.constructor
        delete expectedDescriptors.constructor
  
        // A final wrinkle: Es6 only exposes Object statics off a type
        // if the type explicitly extends Object or the type *is* object
        if (type != Object && 
          expectedLink == Object && !explicitlyExtendsObject) {
          expect(actualDescriptors).toEqual({ })
          continue
        }
  
        expect(actualDescriptors).toEqual(expectedDescriptors)
  
      } while (expectedLink = expectedChain.shift())
    })
  })
})

describe('typeof', () => {
  class MyConstructorClass {
    constructor() { }
  }
  class MyGetterClass {
    get getter() { return { self: this, member: 'getter' } }
  }
  class MySetterType {
    set setter(value) { value({ self: this, member: 'setter' }) }
  }
  class MyMethodType {
    method() { return { self: this, member: 'method' } }
  }
  class MyPropertyType {
    get property() { return { self: this, member: 'property' } }
    set property(value) { value({ self: this, member: 'property' }) }
  }
  class MyFieldType {
    static {
      Object.defineProperty(MyFieldType.prototype, 'field', {
        value: { self: this, member: 'field' },
        configurable: true,
        enumerable: false,
        writable: true,
      })
    }
  }
  
  const DescriptorTests = [
    ['getter', MyGetterClass],
    ['setter', MySetterType],
    ['method', MyMethodType],
    ['property', MyPropertyType],
    ['field', MyFieldType],
    ['constructor', MyConstructorClass],
  ]
  
  describe.each(DescriptorTests)('%s', (key, type) => {
    const descriptorType = key
    it(`should have correct descriptor type`, () => {
      const descriptor = Object.getOwnPropertyDescriptor(type.prototype, key)
      const result = Es6Reflect.typeof(type, key, descriptor)
      expect(result).toBe(descriptorType)
    })
  })
})
