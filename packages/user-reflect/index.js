import { Es6Reflector } from '@kingjs/es6-reflector'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'constructor', 'length', 'name', 'prototype' ]

export const UserReflect = new Es6Reflector({
  knownTypes: KnownTypes,
  knownInstanceKeys: KnownInstanceKeys,
  knownStaticKeys: KnownStaticKeys,
})
