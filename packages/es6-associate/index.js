import { Associate } from '@kingjs/associate'
import { asIterable } from '@kingjs/as-iterable'

// Associates typed objects with types and members.

//  Parameters:
//    type: A class function
//      A type or object to reflect upon.
//    key: (optional) String or symbol
//      A member key.
//    symbol: A symbol
//      The associate symbol.
//    defaultValue: (optional) Value
//      A default value to return or yield if no associate is found.
//    symbols: A pojo like { 
//      [SymbolA]: { map, type },
//      [SymbolB]: { map, type },
//      ...
//    }
//      map: (optional) Function 
//        Transforms the associate before returning or yielding it.
//      type: (optional) Type 
//        Filter associates by this type.

// Type Implementation maps from Associate:
//    getOwnAssociate: Associate.objectGetOwn
//    getAssociate: Associate.objectGet
//    *ownAssociates: Associate.setGetOwn
//    *associates: Associate.associates

// Member Implementation maps from Associate:
//    getOwnMemberAssociate: Associate.mapGetOwn
//    getMemberAssociate: Associate.mapGet
//    *ownMemberAssociates: Associate.lookupGetOwn
//    *memberAssociates: Associate.lookupGet

export class Es6Associate {
  static assembleOwnAssociates(type, symbols) {
    return Associate.ownTypes(type, symbols)  
  }
  static assembleAssociates(type, symbols) {
    return Associate.types(type, symbols)  
  }

  static loadAssociate(type, symbol, fn) {
    return Associate.objectInitialize(type, symbol, fn)
  }
  static getOwnAssociate(type, symbol, { defaultValue } = { }) { 
    return Associate.objectGetOwn(type, symbol) ?? defaultValue
  }
  static getAssociate(type, symbol, { defaultValue } = { }) { 
    return Associate.objectGet(type, symbol) ?? defaultValue
  }

  static addAssociates(type, symbol, values) {
    Associate.setAdd(type, symbol, ...asIterable(values))
  }
  static *ownAssociates(type, symbol) { 
    yield* Associate.setGetOwn(type, symbol)
  }
  static *associates(type, symbol) { 
    yield* Associate.setGet(type, symbol)
  }

  static addMemberAssociate(type, key, symbol, value, { isStatic } = { }) {
    Associate.mapSet(
      isStatic ? type : type.prototype, symbol, key, value)
  }
  static getOwnMemberAssociate(type, key, symbol, { isStatic, defaultValue } = { }) {
    return Associate.mapGetOwn(
      isStatic ? type : type.prototype, symbol, key) ?? defaultValue
  }
  static getMemberAssociate(type, key, symbol, { isStatic, defaultValue } = { }) { 
    return Associate.mapGet(
      isStatic ? type : type.prototype, symbol, key) ?? defaultValue
  }

  static addMemberAssociates(type, key, symbol, values, { isStatic } = { }) {
    Associate.lookupAdd(
      isStatic ? type : type.prototype, symbol, key, ...asIterable(values))
  }
  static *ownMemberAssociates(type, key, symbol, { isStatic } = { }) { 
    yield* Associate.lookupGetOwn(
      isStatic ? type : type.prototype, symbol, key)
  }
  static *memberAssociates(type, key, symbol, { isStatic } = { }) { 
    yield* Associate.lookupGet(
      isStatic ? type : type.prototype, symbol, key)
  }
}
