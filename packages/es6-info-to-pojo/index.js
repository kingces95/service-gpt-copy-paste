import {
  Es6ClassInfo,
  Es6MemberInfo,
} from '@kingjs/es6-info'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'
import { dumpPojo } from "@kingjs/pojo-dump"
import { PojoMetadata } from '@kingjs/pojo-metadata'

function metadata({ ownOnly } = { }) {

  return new PojoMetadata([
    [Es6ClassInfo, {
      name: 'string',
      base: 'name',
      isAnonymous: 'boolean',
      [ownOnly ? 'ownMembers' : 'members']: 'records',
    }],
    [Es6MemberInfo, {
      name: 'key',
      modifiers: 'list',
      host: ({ name }, [ context ]) => 
        name == context.name ? '.' : name,

      // pivots
      type: 'string',
      isStatic: 'boolean',
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
const staticPivotMd = {
  static: {
    predicate: 'isStatic', 
    pivot: knownPivotMd,
  },
  instance: {
    pivot: knownPivotMd
  }
}

Es6ClassInfo.prototype.toPojo = async function({ filter, ownOnly } = { }) {
  const pojo = await toPojo(this, { 
    filter,
    pivot: staticPivotMd,
    metadata: metadata({ ownOnly }),
  })

  const trimmedPojo = trimPojo(pojo)
  return trimmedPojo
}
Es6ClassInfo.prototype.dump = async function(options = { }) {
  const pojo = await this.toPojo(options)
  dumpPojo(pojo)
}
