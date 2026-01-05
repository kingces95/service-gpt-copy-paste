import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PojoMetadata } from '@kingjs/pojo-metadata'

describe('PojoMetadata', () => {
  let pojoMetadata
  
  describe('throw when setting metadata for the same type twice', () => {
    class MyType { }
    beforeEach(() => {
      pojoMetadata = new PojoMetadata()
      pojoMetadata.set(MyType, { a: 1 })
    })
    it('should throw', () => {
      expect(() => 
        pojoMetadata.set(MyType, { b: 2 })
      ).toThrowError(`Pojo metadata for type MyType already exists.`)
    })
  })

  describe('without prior metadata', () => {
    beforeEach(() => {
      pojoMetadata = new PojoMetadata()
    })

    describe('loads Object', () => {
      let objectMd
      beforeEach(() => {
        objectMd = pojoMetadata.get(Object)
      })
      it('should return empty pojo', () => {
        expect(objectMd).toEqual({})
      })
    })
  })

  describe('with prior metadata for MyType and MyExtendedType', () => {
    class MyType { }
    class MyExtendedType extends MyType { }

    beforeEach(() => {
      pojoMetadata = new PojoMetadata([
        [MyType, { a: 1 }],
        [MyExtendedType, { b: 2 }],
      ])
    })
    describe('loads MyType', () => {
      let myTypeMd
      beforeEach(() => {
        myTypeMd = pojoMetadata.get(MyType)
      })
      it('should return pojo metadata', () => {
        expect(myTypeMd).toEqual({ a: 1 })
      })
    })
    describe('loads MyExtendedType', () => {
      let myExtendedTypeMd
      beforeEach(() => {
        myExtendedTypeMd = pojoMetadata.get(MyExtendedType)
      })
      it('should return merged pojo metadata', () => {
        expect(myExtendedTypeMd).toEqual({ a: 1, b: 2 })
      })
    })
  })

  describe('with prior metadata for Object and Function', () => {
    beforeEach(() => {
      pojoMetadata = new PojoMetadata([
        [Object, { a: 1, b: 0 }],
        [Function, { b: 2 }],
      ])
    })

    describe('loads Object', () => {
      let objectMd
      beforeEach(() => {
        objectMd = pojoMetadata.get(Object)
      })
      it('should return pojo metadata', () => {
        expect(objectMd).toEqual({ a: 1, b: 0 })
      })
    })
    describe('loads Function', () => {
      let functionMd
      beforeEach(() => {
        functionMd = pojoMetadata.get(Function)
      })
      it('should return pojo metadata', () => {
        expect(functionMd).toEqual({ a: 1, b: 2 })
      })
    })
  })
})