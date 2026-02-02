import { Es6Reflect } from '@kingjs/es6-reflect'

const Filter = { excludeKnown: true }

export class UserReflect {

  static *ownKeys(type, { isStatic } = { }) {
    yield* Es6Reflect.ownKeys(type, { isStatic, ...Filter })
  }
  static *keys(type, { isStatic } = { }) {
    yield* Es6Reflect.keys(type, { isStatic, ...Filter })
  } 
  static getOwnDescriptor(type, key, { isStatic } = { }) {
    return Es6Reflect.getOwnDescriptor(type, key, { isStatic, ...Filter })
  }
  static *ownDescriptors(type, { isStatic } = { }) {
    yield* Es6Reflect.ownDescriptors(type, { isStatic, ...Filter })
  }
  static *getDescriptor(type, key, { isStatic } = { }) {
    yield* Es6Reflect.getDescriptor(type, key, { isStatic, ...Filter })
  }
  static *descriptors(type, { isStatic } = { }) {
    yield* Es6Reflect.descriptors(type, { isStatic, ...Filter })
  }
  static getHost(type, name, { isStatic } = { }) {
    return Es6Reflect.getHost(type, name, { isStatic, ...Filter })
  }
}
