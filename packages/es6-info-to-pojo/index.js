import {
  Es6ClassInfo,
  Es6MemberInfo,
  Es6ValueMemberInfo,
  Es6DataMemberInfo,
  Es6MethodMemberInfo,
  Es6AccessorMemberInfo,
} from '@kingjs/es6-info'
import { Descriptor } from '@kingjs/descriptor'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"

const {
  userDefined: DefaultUserDefinedModifier,
  accessor: DefaultAccessorModifier,
  value: DefaultValueModifier,
  method: DefaultMethodModifier,
  data: DefaultDataModifier,
} = Descriptor.DefaultModifier

export const Es6InfoToPojoSymbol = Symbol('es6-info-to-pojo')

Es6ClassInfo[Es6InfoToPojoSymbol] = {
  name: 'string',
  base: 'name',
  isAnonymous: false,
  members: 'records',
  ownMembers: 'records',
  // toString: 'string',
}

Es6MemberInfo[Es6InfoToPojoSymbol] = {
  name: 'key',
  type: 'string',
  
  host: 'name',
  isStatic: 'boolean',
  isKnown: 'boolean',
  isNonPublic: 'boolean',

  isConfigurable: DefaultUserDefinedModifier.configurable,

  hasGetter: 'boolean',
  hasSetter: 'boolean',
  rootHost: 'name',
}

Es6ValueMemberInfo[Es6InfoToPojoSymbol] = {
  ...Es6MemberInfo[Es6InfoToPojoSymbol],
  isWritable: DefaultValueModifier.writable,
}

Es6MethodMemberInfo[Es6InfoToPojoSymbol] = {
  ...Es6ValueMemberInfo[Es6InfoToPojoSymbol],
  isEnumerable: DefaultMethodModifier.enumerable,
}

Es6DataMemberInfo[Es6InfoToPojoSymbol] = {
  ...Es6ValueMemberInfo[Es6InfoToPojoSymbol],
  isEnumerable: DefaultDataModifier.enumerable,
}

Es6AccessorMemberInfo[Es6InfoToPojoSymbol] = {
  ...Es6MemberInfo[Es6InfoToPojoSymbol],
  isEnumerable: DefaultAccessorModifier.enumerable,
}

const typePivotMd = {
  constructor: { type: 'constructor' },
  methods: { type: 'method' },
  data: { type: 'data' },
  accessors: { type: 'accessor' },      
}
const nonPublicPivotMd = {
  __nonPublic: {
    predicate: 'isNonPublic', 
    pivot: typePivotMd,
  },
  ...typePivotMd
}
const knownPivotMd = {
  __known: { 
    predicate: 'isKnown', 
    pivot: nonPublicPivotMd,
  },
  ...nonPublicPivotMd
}
const staticPivotMd = {
  static: {
    predicate: 'isStatic', 
    pivot: knownPivotMd,
  },
  instance: {
    pivot: knownPivotMd
  }
}

Es6ClassInfo.prototype.toPojo = async function({ 
  filter, 
  ownOnly,
} = { }) {
  const pojo = await toPojo(this, { 
    filter,
    symbol: Es6InfoToPojoSymbol,
    pivot: staticPivotMd,
    excludeKeys: new Set([
      ownOnly ? 'members' : 'ownMembers',
    ]),
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
Es6ClassInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}
