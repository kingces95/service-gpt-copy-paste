import assert from 'assert'
import { CliProcess } from '@kingjs/cli-process'
import { CliFieldType } from '@kingjs/cli-field-type'
import { CliRecordInfo, CliRecordInfoLoader } from '@kingjs/cli-record-info'

export const DEFAULT_IFS = ' \t\n'

// https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html#index-read

// read 
// One line is read from standard input, or from the file descriptor specified
// by the -u option. The line is split into words using the IFS variable,
// following the same rules as shell word splitting.
//
// Each word is assigned to a corresponding variable in order. If there are
// more words than variables, the remaining words (including delimiters)
// are assigned to the last variable. If there are fewer words than variables,
// the extra variables are set to empty.
//
// A backslash '\' can be used to escape special characters and continue lines.

//https://www.gnu.org/software/bash/manual/html_node/Word-Splitting.html

// 3.5.7 Word Splitting
// The shell scans the results of parameter expansion, command substitution,
// and arithmetic expansion (if they are not inside double quotes) for word splitting.
//
// Each character in the IFS variable is treated as a delimiter, and the shell splits
// the expansion result into words using these characters.
//
// If IFS is unset, or set to exactly <space><tab><newline> (the default),
// leading and trailing sequences of these characters are ignored,
// and sequences not at the boundaries are used to delimit words.
//
// If IFS is set to something else, then:
// - Leading and trailing whitespace characters that are also in IFS are ignored.
// - Non-whitespace IFS characters, along with any adjacent IFS-whitespace,
//   delimit fields.
// - Sequences of IFS-whitespace characters also act as delimiters.
//
// If IFS is null, no word splitting occurs.
//
// Explicit null arguments (like "" or '') are preserved and passed as empty strings.
// Unquoted null arguments (from expansions of unset parameters) are removed.
// If a parameter is expanded inside double quotes and has no value,
// it becomes a retained null argument (an empty string).
//
// If a quoted null argument appears in a non-null word (e.g., -d''),
// the null part is removed, resulting in just -d.
//
// Important: If no expansion occurs, then no word splitting happens.

// Examples:
// $ IFS=', ' read a <<< ' ff , ' && declare -p a
// declare -- a="ff"
// $ IFS=', ' read a <<< ' f f , ' && declare -p a
// declare -- a="f f ,"
// $ IFS=', ' read a <<< ' , ff ' && declare -p a
// declare -- a=", ff"
// $ IFS=', ' read a <<< ', ff ' && declare -p a
// declare -- a=", ff"
// $ IFS=', ' read a <<< ' ,ff ' && declare -p a
// declare -- a=",ff"
// $ IFS=', ' read a <<< ' ff, ' && declare -p a
// declare -- a="ff"
// $ IFS=', ' read a <<< ' ,ff, ' && declare -p a
// declare -- a=",ff,"
// $ IFS=', ' read a <<< ' , ff , ' && declare -p a
// declare -- a=", ff ,"

// $ IFS=', ' read a b <<< ' f , ff ' && declare -p a b
// declare -- a="f"
// declare -- b="ff"
// $ IFS=', ' read a b <<< ' f , ff , ' && declare -p a b
// declare -- a="f"
// declare -- b="ff"
// $ IFS=', ' read a b <<< ' f , f,f ' && declare -p a b
// declare -- a="f"
// declare -- b="f,f"
// $ IFS=', ' read a b <<< ' f , ,f,f ' && declare -p a b
// declare -- a="f"
// declare -- b=",f,f"
// $ IFS=', ' read a b <<< ' f ,f,f ' && declare -p a b
// declare -- a="f"
// declare -- b="f,f"
// $ IFS=', ' read a b <<< ' , f , ff ' && declare -p a b
// declare -- a=""
// declare -- b="f , ff"
// $ IFS=', ' read a b <<< ' , , f , ff ' && declare -p a b
// declare -- a=""
// declare -- b=", f , ff"

class CliSplitterRx {
  static noMatch = [null, 0]

  #rx

  constructor(rx) {
    this.#rx = new RegExp(rx, 'y')
  }

  match(line, index = 0) {
    if (line.length == index) return CliSplitterRx.noMatch
    this.#rx.lastIndex = index
    const match = this.#rx.exec(line)
    if (!match) return CliSplitterRx.noMatch
    return [match[1], this.#rx.lastIndex - index]
  }
}

export class CliSplitter {
  static get ifs() { return CliProcess.env?.IFS ?? DEFAULT_IFS }

  #literalRe
  #lastLiteralRe
  #commentRe

  constructor(ifs = CliSplitter.ifs) {
    const ws = ' \t\n'
    const wsIfs = [...ifs].filter(c => ws.includes(c)).join('')
    const nwsIfs = [...ifs].filter(c => !ws.includes(c)).join('')

    // Literal regex parses next literal from the stream. The regex ignores 
    // leading witespace IFS characters, then takes any non-IFS characters up 
    // to the next IFS character as the literal. Finally, it consumes any 
    // trailing whitespace IFS characters and optionally consumes a single 
    // non-whitespace IFS character (e.g. a comment marker).
    this.#literalRe = new CliSplitterRx(
      `[${wsIfs}]*([^${ifs}]*)[${wsIfs}]*[${nwsIfs}]?`)
    
    // Last literal regex attempts to parse a final literal. The regex ignores
    // leading whitespace IFS characters, then takes at least one non-IFS 
    // characters as the literal. Finally, it consumes any trailing
    // IFS characters whitespace or not.
    this.#lastLiteralRe = new CliSplitterRx(
      `[${wsIfs}]*([^${ifs}]+)[${ifs}]*$`)

    // Comment regex is a fallback if last literal regex fails. Comment regex
    // the remaing line trimmed of leading and trailing IFS *whitespace* characters.
    this.#commentRe = new CliSplitterRx(
      `[${wsIfs}]*([^${wsIfs}].*[^${wsIfs}])[${wsIfs}]*$`) 
  }

  *#split(line, isCommentFn) {
    const { literalRe, lastLiteralRe, commentRe } = this

    let x = 0
    while (!isCommentFn()) {
      // attempt to yield the next literal
      const [ field, dx ] = literalRe.match(line, x); x += dx
      if (field == null) return
      yield field
    }

    // attempt to yield the last literal
    const [ lastLiteral ] = lastLiteralRe.match(line, x)
    if (lastLiteral) {
      yield lastLiteral
      return
    }

    // fallback to yielding a comment if there is one
    const [ comment ] = commentRe.match(line, x)
    if (comment) yield comment
  }

  get literalRe() { return this.#literalRe }
  get lastLiteralRe() { return this.#lastLiteralRe }
  get commentRe() { return this.#commentRe }

  split(line) {
    let isComment = false
    const isCommentFn = () => isComment
    const generator = this.#split(line, isCommentFn)
    generator.rest = () => {
      isComment = true
      return generator.next()
    }
    return generator 
  }
}

export class CliParser {

  static parse(line, metadata) {
    const parser = this.create(metadata)
    return parser.parse(line)
  }

  static create(metadata) {
    const info = CliRecordInfoLoader.load(metadata)
    return new this(info)
  }

  static #parseNext(context, info, field, split) {
    // if there is context, the field must be untyped (any)
    assert(!context || field.isAny)

    // if the fields it typed, then there should be no context
    assert(field.isAny || !context)

    // if there is context, it must be a complex or primitive type
    const contextIsRecordInfo = context instanceof CliRecordInfo
    const contextIsFieldType = context instanceof CliFieldType
    assert(!context || contextIsRecordInfo || contextIsFieldType)
    
    // recursive case: context is complex type
    if (contextIsRecordInfo)
      return this.#parse(context, split)
    
    // base case: no context or context is a primitive type
    const type = contextIsFieldType ? context : field.type
    const { value: text, done: noMoreValues } = 
      type.isComment ? split.rest() : split.next()

    if (noMoreValues) {
      const { isText, isList } = info
      if (isText) return null
      if (isList) return null // no default values for lists
      if (field.isComment && field.isImplicit) return null
      // fill remaining fields with default values
    }

    const value = type.parse(text)
    assert(value != null)
    return value
  }

  static #parse(info, split) {
    const fields = info.fields()
    const { isObject, isString } = info

    let result = isString ? '' : isObject ? {} : []
    let context = null // type or record 

    while (true) {
      const { value: field, done: noMoreFields } = fields.next()
      if (noMoreFields) break

      const value = this.#parseNext(context, info, field, split)
      if (value == null) break

      if (isString) result = value
      else if (isObject) result[field.name] = value
      else result.push(value)

      context = field.isEnum 
        ? field.discriminate(value) 
        : null
    }

    return result    
  }
  
  #info

  constructor(info) {
    this.#info = info
  }

  get info() { return this.#info }


  parse(line) {
    const splitter = new CliSplitter()
    const split = splitter.split(line)

    return CliParser.#parse(this.info, split)
  }
}
