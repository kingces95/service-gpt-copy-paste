import assert from 'assert'
import { CliFieldType } from '@kingjs/cli-field-type'
import { Lazy } from '@kingjs/lazy'

const DEFAULT_COMMENT_FIELD_NAME = '$'
const DEFAULT_DISCRIMINATED_FIELD_NAME = '_'

export class CliFieldInfo {
  #loader
  #type
  #name
  #implicit
  #discriminations

  constructor(loader, type, { 
    name, 
    discriminations,
    implicit = false
  } = { }) {
    const hasDiscriminations = discriminations != null
    assert(hasDiscriminations == type.isEnum,
      'Discriminator field must be an enum field')

    this.#loader = loader
    this.#type = type
    this.#name = name ?? null
    this.#implicit = implicit

    // Discriminations are named metadata. Metadata can resolve to either
    // CliRecordInfo or CliFieldType. If it resolves to CliRecordInfo,
    // it is a nested record. If it resolves to CliFieldType, it simply
    // provides the type for the next field which will be 'any' type by 
    // construction.
    this.#discriminations = Object.fromEntries(
      Object.entries(discriminations ?? { })
        .map(([name, metadata]) => [name, new Lazy(() =>
          loader.load(metadata)               // CliRecordInfo
            ?? CliFieldType.getType(metadata) // CliFieldType
        )])
    )
  }

  get loader() { return this.#loader }
  get type() { return this.#type }
  get name() { return this.#name }

  get isImplicit() { return this.#implicit }
  get isNumber() { return this.#type.isNumber }
  get isBoolean() { return this.#type.isBoolean }
  get isWord() { return this.#type.isWord }
  get isEnum() { return this.#type.isEnum }
  get isLiteral() { return this.#type.isLiteral }
  get isComment() { return this.#type.isComment }
  get isAny() { return this.#type.isAny }

  parse(value) {
    return this.#type.parse(value)
  }
  discriminate(discriminator) {
    return this.#discriminations[discriminator].value
  }
}

export class CliRecordInfo {
  #loader

  constructor(loader) {
    this.#loader = loader
  }

  get loader() { return this.#loader }

  get jsType() {
    switch (this.type) {
      case 'udt': return this.isNamed ? Object : Array
      case 'list': return Array
      case 'words': return Array
      case 'text': return String
    }
  }
  get isArray() { return this.jsType === Array }
  get isObject() { return this.jsType === Object }
  get isString() { return this.jsType === String }

  // A line is view in the abstract as fields plus an optional comment.
  // Example line: John Doe, 42, true, # system administrator
  
  get type() { }

  // User Defined Type (UDT) is a record with typed fields possibly named.
  // Named:
  //    metadata is a pojo like { name: type, ... }. If the last type
  //    is not a comment, a default comment field is added with name $.
  //    Example metadata: { name: '?', age: '#', active: '!', comment: '*' }
  //    Example metadata: { name: '?', age: '#', active: '!' }
  // Unnamed:
  //    metadata is an array of types like ['word', 'number', ...]. If
  //    the last type is not a comment, an implicit comment field is added.
  //    Example metadata: ['?', '#', '!', '*'] // explicit comment
  //    Example metadata: ['?', '#', '!'] // implicit comment
  get isNamed() { return false }
  get isUserDefined() { return this.type === 'udt' }

  // metadata is a number n of the number of word fields. An implicit
  // comment field is always added as the last field. 
  // Example metadata: 3 // 3 word fields plus an implicit comment
  get isWords() { return this.type === 'words' }

  // metadata is not specified. Treats the whole line as a comment
  // which is returned as a string (like isWords with zero fields).
  // Example metadata: undefined or 0
  get isText() { return this.type === 'text' }

  // metadata is Infinity. Treats line as if there is no comment. 
  // Continues filling the array until the end of the line (like
  // isWords with Infinity fields).
  // Example metadata: Infinity
  get isList() { return this.type === 'list' }

  // If there are fewer fields than those explicitly specified in 
  // metadata, the missing fields are filled with default values
  // (e.g. empty string for word, NaN for number, false for boolean).
  // Practically, since only the comment field can be implicit, this
  // means that when implicit, the comment field is not assigned a
  // default value when no comment is found.
  get count() { }
  *fields() { }
}
class CliUntypedFieldRecordInfo extends CliRecordInfo { 
  constructor(loader) {
    super(loader)
  }

  *fields() { 
    // yield a count number of word fields
    for (let i = 0; i < this.count - 1; i++)
      yield this.loader.loadField(CliFieldType.word)

    // yield a comment field
    yield this.loader.loadField(
      CliFieldType.comment, { implicit: true })
  }
}
class CliTextFieldRecordInfo extends CliUntypedFieldRecordInfo {
  constructor(loader) {
    super(loader)
  }

  get count() { return 1 } // only the comment field
  get type() { return 'text' }
}
class CliListFieldRecordInfo extends CliUntypedFieldRecordInfo {
  constructor(loader) {
    super(loader)
  }

  get count() { return Infinity } // no limit on the number of fields
  get type() { return 'list' }
}
class CliWordsFieldRecordInfo extends CliUntypedFieldRecordInfo {
  #wordCount

  constructor(loader, wordCount) {
    assert(Number.isInteger(wordCount), 'wordCount must be an integer')
    assert(wordCount >= 0, 'wordCount must be a positive number')
    super(loader)
    this.#wordCount = wordCount
  }

  get count() { return this.#wordCount + 1 } // +1 for comment field
  get type() { return 'words' }
}
class CliUserDefinedFieldRecordInfo extends CliRecordInfo {
  #fieldInfos

  constructor(loader, metadata) {
    super(loader)
    
    const fieldInfos = Object.entries(metadata)
      .map(([name, value], i) => {
        assert(value != null, `Field '${name}' must have a type`)
        const options = { }
        if (this.isNamed) 
          options.name = name

        const type = CliFieldType.getType(value)
        if (type.isEnum)
          options.discriminations = value

        return loader.loadField(type, options)
      })

    // upto the last field, all fields must be literal fields
    assert(fieldInfos.slice(0, -1).every(f => f.isLiteral), 
      'All fields except the last must be literal fields')

    // if the last field is an enum, add a discriminated field
    if (fieldInfos.at(-1)?.isEnum) {
      fieldInfos.push(loader.loadField(
        CliFieldType.any, {
          implicit: true, 
          name: this.isNamed ? DEFAULT_DISCRIMINATED_FIELD_NAME : undefined
        })
      )
    }

    // if the last field is not a comment, add a default comment field
    if (!(fieldInfos.at(-1)?.isComment)) {
      fieldInfos.push(loader.loadField(
        CliFieldType.comment, {
          implicit: true, 
          name: this.isNamed ? DEFAULT_COMMENT_FIELD_NAME : undefined
        })
      )
    }

    // the last field must be a comment field
    assert(fieldInfos.at(-1)?.isComment, 
      'Last field must be a comment field')

    this.#fieldInfos = fieldInfos
  }

  get type() { return 'udt' }

  get count() { return this.#fieldInfos.length }
  *fields() { yield* this.#fieldInfos }
}
class CliNamedFieldRecordInfo extends CliUserDefinedFieldRecordInfo {
  constructor(loader, metadata) {
    assert(metadata && typeof metadata === 'object', 
      'metadata must be an object with field names as keys and types as values')
    super(loader, metadata)
  }

  get isNamed() { return true }
}
class CliUnnamedFieldRecordInfo extends CliUserDefinedFieldRecordInfo {
  constructor(loader, metadata) {
    assert(Array.isArray(metadata), 'types must be an array')
    super(loader, metadata)
  }
}

export class CliRecordInfoLoader {
  static #loadAnonymousField(type) {
    const cache = CliRecordInfoLoader.#annonymousFieldInfos
    if (!cache.has(type))
      cache.set(type, new CliFieldInfo(this, type))
    return cache.get(type)
  }
  static #loadImplicitCommentField() {
    if (!this.#implicitCommentFieldInfo) {
      const options = { implicit: true }
      this.#implicitCommentFieldInfo = 
        new CliFieldInfo(this, CliFieldType.comment, options)
    }
    return this.#implicitCommentFieldInfo
  }
  static #loadDefaultCommentField() {
    if (!this.#defaultCommentFieldInfo) {
      const name = DEFAULT_COMMENT_FIELD_NAME
      const options = { name, implicit: true }
      this.#defaultCommentFieldInfo = 
        new CliFieldInfo(this, CliFieldType.comment, options)
    }
    return this.#defaultCommentFieldInfo
  }
  static #loadWordsRecord(count) {
    assert(Number.isInteger(count), 'count must be an integer')
    assert(count >= 0, 'count must be a non-negative number')

    const cache = this.#untypedRecordInfos
    if (!cache.has(count))
      cache.set(count, new CliWordsFieldRecordInfo(this, count))
    return cache.get(count)
  }

  // cache when benifit of reuse expected to exceed memory cost
  static #textFieldRecordInfo
  static #listFieldRecordInfo
  static #implicitCommentFieldInfo
  static #defaultCommentFieldInfo
  static #untypedRecordInfos = new Map()
  static #annonymousFieldInfos = new Map()
  static {
    this.#textFieldRecordInfo = new CliTextFieldRecordInfo(this)
    this.#listFieldRecordInfo = new CliListFieldRecordInfo(this)
  }

  static loadField(type, { 
    name, 
    discriminations, 
    implicit 
  } = { }) {
    assert(type instanceof CliFieldType, 'type must be an instance of CliFieldType')

    // cache implicit comments
    if (type.isComment && implicit) {
      if (name == DEFAULT_COMMENT_FIELD_NAME)
        return this.#loadDefaultCommentField()
      return this.#loadImplicitCommentField()
    }

    // cache annonymous fields w/o any discriminations
    if (!name && !type.isEnum)
      return this.#loadAnonymousField(type)

    return new CliFieldInfo(this, type, { name, discriminations })
  }

  // A line is viewed as zero or more fields plus an optional comment.

  // Metadata is an ordered list of fields with optional names which can
  // be universally typed as 'word' and optionally refined as 'number', 
  // or 'boolean'. Alises for those types are '?', '#', and '!' respectively.
  
  // The comment field must be the last field and have a type 'comment' or '*'. 
  // If no comment field is specified, a default comment field is added to the 
  // end of the metadata with default name '$' if needed.

  // For example, given IFS=', ' and the line:
  //   false, 42, hello, world
  // The following metadata will result in the following records:
  //   { x: '!', y: '#', z: '?', comment: 'comment' }
  //     => { x: false, y: 42, z: 'hello', comment: 'world' }
  //   { x: '!', y: '#', z: '?' }
  //     => { x: false, y: 42, z: 'hello' }
  //   { x: '!', y: '#', z: '*' }
  //     => { x: false, y: 42, z: 'hello, world' }
  //   { x: '!' } => { x: false }
  //   [ '!', '#', '?' ] => [ false, 42, 'hello', 'world' ]
  //   [ '!', '#', '*' ] => [ false, 42, 'hello, world' ]
  //   2 => [ '?', '?' ] => [ false, 42, 'hello, world' ]
  //   3 => [ '?', '?', '?' ] => [ false, 42, 'hello', 'world' ]

  // Fields which are word discriminators can be represented as a pojo with 
  // each key being the value of a discrimination and the corresponding key 
  // value being metadata describing the rest of the fields.

  // For example, a logging stream with the following lines:
  //   42 started 2023, 10, 01
  //   43 comment # system started
  
  // Can be represented a tuple with nested named fields:
  //   ['#', { 
  //      started: { year: '#', month: '#', day: '#' }, 
  //      comment: '*' 
  //   }]
  // And deserialized as:
  //   [ 42, started, { year: 2023, month: 10, day: 1 }]
  //   [ 43, comment, 'system started' ]

  // Or as nested tuples:
  //   ['#', {
  //      started: ['#', '#', '#'],
  //      comment: '*'
  //   }]
  // And deserialized as:
  //   [ 42, started, [2023, 10, 1] ]
  //   [ 43, comment, 'system started' ]

  // Or as nested named fields:
  //   { id: '#', type: { 
  //      started: { year: '#', month: '#', day: '#' }, 
  //      comment: '*' 
  //   }}
  // And deserialized as:
  //   { id: 42, type: 'started', _: { year: 2023, month: 10, day: 1 } },
  //   { id: 43, type: 'comment', _: 'system started' }
  static load(metadata) {
    if (metadata instanceof CliRecordInfo) 
      return metadata

    if (metadata === Infinity)
      return this.#listFieldRecordInfo

    if (metadata == null) 
      return this.#textFieldRecordInfo

    if (typeof metadata === 'number') 
      return this.#loadWordsRecord(metadata)

    // typed records are not (yet) cached, and may never be

    if (Array.isArray(metadata))
      return new CliUnnamedFieldRecordInfo(this, metadata)

    if (typeof metadata === 'object')
      return new CliNamedFieldRecordInfo(this, metadata)
  }
}
