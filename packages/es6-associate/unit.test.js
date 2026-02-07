import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { Es6Associate } from '@kingjs/es6-associate'

class MyClass { }
class MyExtendedClass extends MyClass { }

const SingletonOnType = {
  set: Es6Associate.loadAssociate,
  getOwn: Es6Associate.getOwnAssociate,
  get: Es6Associate.getAssociate,
  setIsLazy: true,
}

const ManyOnType = {
  set: Es6Associate.addAssociates,
  getOwn: Es6Associate.ownAssociates,
  get: Es6Associate.associates,
  getIsIterable: true,
}

const SingletonOnMember = {
  key: 'member',
  set: Es6Associate.addMemberAssociate,
  getOwn: Es6Associate.getOwnMemberAssociate,
  get: Es6Associate.getMemberAssociate,
}

const ManyOnMember = {
  key: 'member',
  set: Es6Associate.addMemberAssociates,
  getOwn: Es6Associate.ownMemberAssociates,
  get: Es6Associate.memberAssociates,
  getIsIterable: true,
}

const Tests = [
  ['SingletonOnType', SingletonOnType],
  ['ManyOnType', ManyOnType],
  ['SingletonOnMember', SingletonOnMember],
  ['SingletonOnMember (static)', SingletonOnMember, true],
  ['ManyOnMember', ManyOnMember],
  ['ManyOnMember (static)', ManyOnMember, true],
]

describe.each(Tests)('%s', (name, api, isStatic) => {
  describe('An associate', () => {
    describe.each([ 
      ['on', true], 
      ['not on', false] 
    ])('%s MyClass', (_, on) => {
      let MySymbol = Symbol('MySymbol')
      const associate = 'associate'
      const associate2 = 'assoicate2'
      const defaultValue = null

      let expected
      let args
      let options
  
      beforeEach(() => {
        args = []
        options = { }
        expected = on 
          ? (api.getIsIterable ? [associate, associate2] : associate)
          : (api.getIsIterable ? [] : defaultValue)

        if (api.key) args.push(api.key)
        args.push(MySymbol)

        if (isStatic) options.isStatic = true

        if (on) {
          api.set(MyClass, ...args, 
            api.setIsLazy ? () => associate : associate, options)

          if (api.getIsIterable) api.set(MyClass, ...args, 
            [associate2, associate2], options)
        }
      })
  
      it('should be found on MyClass', () => {
        let actual = api.getOwn(MyClass, ...args, options)
        if (api.getIsIterable) actual = [...actual]
        expect(actual).toEqual(expected)
      })
      it('should be found indirectly on MyClass', () => {
        let actual = api.get(MyClass, ...args, options)
        if (api.getIsIterable) actual = [...actual]
        expect(actual).toEqual(expected)
      })
      it('should not be found on MyExtendedClass', () => {
        let actual = api.getOwn(MyExtendedClass, ...args, options)
        if (api.getIsIterable) actual = [...actual]
        expect(actual).toEqual(api.getIsIterable ? [] : defaultValue)
      })
      it('should be found indirectly on MyExtendedClass', () => {
        let actual = api.get(MyExtendedClass, ...args, options)
        if (api.getIsIterable) actual = [...actual]
        expect(actual).toEqual(expected)
      })
    })
  })
})
