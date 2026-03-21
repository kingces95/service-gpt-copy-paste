import { Es6Reflector } from '@kingjs/es6-reflector'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'constructor', 'length', 'name', 'prototype' ]

class Es6UserReflector extends Es6Reflector {
  constructor() {
    super({
      knownTypes: KnownTypes,
      knownInstanceKeys: KnownInstanceKeys,
      knownStaticKeys: KnownStaticKeys,
    })
  }
}

export const Es6UserReflect = new Es6UserReflector()