import { Es6Reflector } from '@kingjs/es6-reflector'

const KnownTypes = [ Object, Function ]
const KnownInstanceKeys = [ 'constructor' ]
const KnownStaticKeys = [ 'length', 'name', 'prototype' ]

export const Es6UserReflect = Es6Reflector.create({
  knownTypes: KnownTypes,
  knownKeys: KnownInstanceKeys,
  knownStaticKeys: KnownStaticKeys,
})
