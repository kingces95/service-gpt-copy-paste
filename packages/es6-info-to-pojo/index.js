import {
  Es6ClassInfo,
  Es6MemberInfo,
} from '@kingjs/es6-info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"
import { PojoMetadata } from '@kingjs/pojo-metadata'

function metadata({ ownOnly, isStatic } = { }) {

  return new PojoMetadata([
    [Es6ClassInfo, {
      name: 'string',
      base: 'name',
      isAnonymous: 'boolean',
      [ownOnly ? 'ownMembers' : 'members']: 
        isStatic == true ? 'ignore' : 'records',
      [ownOnly ? 'ownStaticMembers' : 'staticMembers']: 
        isStatic == false ? 'ignore' : 'records',
    }],
    [Es6MemberInfo, {
      name: 'key',
      modifiers: 'list',
      host: ({ name }, [ context ]) => 
        name == context.name ? '.' : name,

      // pivots
      type: 'string',
      isKnown: 'boolean',
      isNonPublic: 'boolean',
    }]
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
const knownPivotMd = {
  __known: { 
    predicate: 'isKnown', 
    pivot: nonPublicPivotMd,
  },
  ...nonPublicPivotMd
}

Es6ClassInfo.prototype.toPojo = async function({ 
  ownOnly, isStatic, ...filter } = { }) {

  const pojo = await toPojo(this, { 
    filter,
    pivot: knownPivotMd,
    metadata: metadata({ ownOnly, isStatic }),
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
Es6ClassInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}
