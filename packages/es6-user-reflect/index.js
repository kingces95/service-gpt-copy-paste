import { Es6Reflector } from '@kingjs/es6-reflector'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype' ]

export const Es6UserReflect = new Es6Reflector({
  knownTypes: KnownTypes,
  knownInstanceKeys: KnownInstanceKeys,
  knownStaticKeys: KnownStaticKeys,
})
