import {
  Info,
  FunctionInfo,
  MemberInfo,
  ValueMemberInfo,
  AccessorMemberInfo,
  MethodMemberInfo,
  DataMemberInfo,
} from '@kingjs/info'
import { 
  Es6ClassInfo,
  Es6MemberInfo,
  Es6ValueMemberInfo,
  Es6MethodMemberInfo,
  Es6DataMemberInfo,
  Es6AccessorMemberInfo,
} from '@kingjs/es6-info'
import { Es6InfoToPojoSymbol } from '@kingjs/es6-info-to-pojo'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"

const InfoToPojoSymbol = Symbol('info-to-pojo')

FunctionInfo[InfoToPojoSymbol] = {
  ...Es6ClassInfo[Es6InfoToPojoSymbol],
}

MemberInfo[InfoToPojoSymbol] = {
  ...Es6MemberInfo[Es6InfoToPojoSymbol],
  isConceptual: 'boolean',
  isAbstract: 'boolean',
  concepts: 'names',
}

AccessorMemberInfo[InfoToPojoSymbol] = {
  ...MemberInfo[InfoToPojoSymbol],
  ...Es6AccessorMemberInfo[InfoToPojoSymbol],
}

ValueMemberInfo[InfoToPojoSymbol] = {
  ...MemberInfo[InfoToPojoSymbol],
  ...Es6ValueMemberInfo[Es6InfoToPojoSymbol],
}

MethodMemberInfo[InfoToPojoSymbol] = {
  ...ValueMemberInfo[InfoToPojoSymbol],
  ...Es6MethodMemberInfo[Es6InfoToPojoSymbol],
}

DataMemberInfo[InfoToPojoSymbol] = {
  ...ValueMemberInfo[InfoToPojoSymbol],
  ...Es6DataMemberInfo[Es6InfoToPojoSymbol],
}

const typePivotMd = {
  methods: { type: 'method' },
  data: { type: 'data' },
  accessors: { type: 'accessor' },
  constructor: { type: 'constructor' },    
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
const conceptualPivotMd = {
  conceptual: {
    predicate: 'isConceptual',
    copyPivot: [ 'concepts', typePivotMd ],
  },
  ...staticPivotMd
}

FunctionInfo.prototype.toPojo = async function({ 
  filter,
  ownOnly,
} = { }) {
  const pojo = await toPojo(this, { 
    filter,
    symbol: InfoToPojoSymbol,
    pivot: conceptualPivotMd,
    excludeKeys: new Set([
      ownOnly ? 'members' : 'ownMembers',
    ]),
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
FunctionInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}
