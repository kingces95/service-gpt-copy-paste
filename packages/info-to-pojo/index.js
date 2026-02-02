import {
  TypeInfo,
  MemberInfo,
} from '@kingjs/info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"
import { PojoMetadata } from '@kingjs/pojo-metadata'
import { isAbstract } from '@kingjs/abstract'

function metadata({ ownOnly, isStatic } = { }) {
  return new PojoMetadata([
    [TypeInfo, {
      name: 'string',
      base: 'name',
      isAbstract: 'boolean',
      isConcept: 'boolean',
      isAnonymous: 'boolean',
      [ownOnly ? 'ownMembers' : 'members']: 
        isStatic == true ? 'ignore' : 'records',
      [ownOnly ? 'ownStaticMembers' : 'staticMembers']: 
        isStatic == false ? 'ignore' : 'records',
    }],
    [MemberInfo, {
      name: 'key',
      modifiers: 'list',
      host: ({ name }, [ context ]) => 
        name == context.name ? '.' : name,

      // pivots
      type: 'string',
      // isStatic: 'boolean',
      isKnown: 'boolean',
      isNonPublic: 'boolean',
      isConceptual: 'boolean',
      isAbstract: function(
        isAbstract, [ { isConcept }, { isConceptual } ]) {
          if (isConcept) return isAbstract ? null : false
          if (isConceptual) return isAbstract ? null : false
          return isAbstract ? true : null
        },
      concepts: 'names',
    }],
  ])
}

const typePivotMd = {
  constructor: { discriminator: 'constructor' },
  methods: { discriminator: 'method' },
  getters: { discriminator: 'getter' },
  setters: { discriminator: 'setter' },
  properties: { discriminator: 'property' },
  fields: { discriminator: 'field' },
}
const nonPublicPivotMd = {
  __nonPublic: {
    predicate: 'isNonPublic', 
    pivot: typePivotMd,
  },
  ...typePivotMd
}
const conceptualPivotMd = {
  conceptual: {
    predicate: 'isConceptual',
    copyPivot: [ 'concepts', nonPublicPivotMd ],
  },
  ...nonPublicPivotMd
}

TypeInfo.prototype.toPojo = async function({ 
  ownOnly, ...filter } = { }) {

  const pojo = await toPojo(this, { 
    filter,
    pivot: conceptualPivotMd,
    metadata: metadata({ ownOnly }),
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
TypeInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}
