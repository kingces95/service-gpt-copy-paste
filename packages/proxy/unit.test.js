import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { createProxy, GlobalPrecondition } from "@kingjs/proxy"

describe('A disposable freezable class', () => {
  let type
  beforeEach(() => {
    type = class {
      constructor() {
        this.value$ = 42
        this.readOnly$ = false
        this.isDisposed$ = false
        this.version$ = 0
      }
      dispose() {
        this.isDisposed$ = true
      }
      
      get readOnly() { return this.readOnly$ }
      set readOnly(value) { this.readOnly$ = value }

      get value() { return this.value$ }
      set value(value) { this.value$ = value }

      compareTo(other) { return 0 }
    }
  })
  describe('when created', () => {
    let instance
    beforeEach(() => {
      instance = new type()
    })
    it('should have a value', () => {
      expect(instance.value).toBe(42)
    })
    it('should not be read-only', () => {
      expect(instance.readOnly).toBe(false)
    })
    it('should compareTo itself', () => {
      expect(instance.compareTo(instance)).toBe(0)
    })
    it('should compareTo null as zero', () => {
      expect(instance.compareTo(null)).toBe(0)
    })
    describe('when set to a new value', () => {
      beforeEach(() => {
        instance.value = 100
      })
      it('should have the new value', () => {
        expect(instance.value).toBe(100)
      })
    })
    describe('when disposed', () => {
      beforeEach(() => {
        instance.dispose()
      })
      it('should still have a value', () => {
        expect(instance.value).toBe(42)
      })
    })
    describe('when proxied', () => {
      let proxy
      let version
      beforeEach(() => {
        version = 0
        const preconditions = {
          [GlobalPrecondition]: function() {
            // expect this to be the instance, not the proxy
            expect(this == instance).toBe(true)
            expect(this == proxy).toBe(false)

            if (this.isDisposed$) throw new Error(
              "Instance is disposed and cannot be used.")
          },
          compareTo(other) {
            // expect this to be the instance, not the proxy
            expect(this == instance).toBe(true)
            expect(this == proxy).toBe(false)

            if (other == null) throw new Error(
              "Cannot compare to null.")
          },
          get value() {
            // expect this to be the instance, not the proxy
            expect(this == instance).toBe(true)
            expect(this == proxy).toBe(false)
            
            // throw if the instance is stale (version not latest)
            if (this.version$ !== version) throw new Error(
              "Instance is stale and cannot be used.")
          },
          set value(value) {
            // expect this to be the instance, not the proxy
            expect(this == instance).toBe(true)
            expect(this == proxy).toBe(false)

            // if the instance is read-only, throw an error
            if (this.readOnly$) throw new Error(
              "Cannot set value when read-only.")
          }
        }
        
        proxy = createProxy(instance, { preconditions })
      })
      it('should have a value', () => {
        expect(proxy.value).toBe(42)
      })
      it('should compareTo itself', () => {
        expect(proxy.compareTo(proxy)).toBe(0)
      })
      it('should throw if compareTo null', () => {
        expect(() => { proxy.compareTo(null) }).toThrow(
          'Cannot compare to null.')
      })
      describe('when the version is updated', () => {
        beforeEach(() => {
          version = 1
        })
        it('should throw when accessed', () => {
          expect(() => { proxy.value }).toThrow(
            'Instance is stale and cannot be used.')
        })
      })
      describe('when set to a new value', () => {
        beforeEach(() => {
          proxy.value = 100
        })
        it('should have the new value', () => {
          expect(proxy.value).toBe(100)
        })
      })
      describe('when read-only', () => {
        beforeEach(() => {
          proxy.readOnly = true
        })
        it('should be read-only', () => {
          expect(proxy.readOnly).toBe(true)
        })
        it('should not be writable', () => {
          expect(() => { proxy.value = 100 }).toThrow(
            'Cannot set value when read-only.')
        })
      })
      describe('when disposed', () => {
        beforeEach(() => {
          proxy.dispose()
        })
        it('should throw when accessed', () => {
          expect(() => { proxy.value }).toThrow(
            'Instance is disposed and cannot be used.')
        })
        it('should throw when disposed again', () => {
          expect(() => { proxy.dispose() }).toThrow(
            'Instance is disposed and cannot be used.')
        })
      })
    })
  })
})