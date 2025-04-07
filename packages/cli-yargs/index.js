import _ from 'lodash'
import yargs from 'yargs'
import { Lazy } from '@kingjs/lazy'
import { dumpPojo } from '@kingjs/pojo-dump'
import { toPojo } from '@kingjs/pojo'
import { hideBin } from 'yargs/helpers'

async function __import() {
  const { cliYargsToPojo } = await import('@kingjs/cli-yargs-to-pojo')
  return { toPojo: cliYargsToPojo }
}

const KNONWN_OPTIONS = [
  'help'//, 'version'
]

export class CliYargs {
  #name

  constructor(name) {
    this.#name = name
  }

  get name() { return this.#name }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(this)
  }
  
  async __dump() {
    return dumpPojo(await this.toPojo())
  }
}

export class CliYargsParameter extends CliYargs {
  static create(scope, name, pojo) {
    if (pojo.position !== undefined)
      return new CliYargsPositional(scope, name, pojo)
    return new CliYargsOption(scope, name, pojo)
  }

  #pojo
  #scope
  #name

  constructor(scope, name, pojo) {
    super(name)
    this.#scope = scope
    this.#name = name
    this.#pojo = pojo
  }

  get isPositional() { return this.#pojo.position !== undefined }
  get isOption() { return this.#pojo.position === undefined }

  get command() { return this.#scope }
  get name() { return this.#name }
  get description() { return this.#pojo.description }

  // abstract properties
  get position() { return undefined }
  get demandOption() { return undefined }
  get global() { return undefined }
  get hidden() { return undefined }

  // https://github.com/yargs/yargs/blob/main/docs/api.md#positionalkey-opt
  // https://github.com/yargs/yargs/blob/main/docs/api.md#optionskey-opt
  get alias() { return this.#pojo?.aliases }
  get choices() { return this.#pojo?.choices }
  get coerce() { return this.#pojo?.coerce }
  get conflicts() { return this.#pojo?.conflicts }
  get default() { return this.#pojo?.default }
  get defaultDescription() { return this.#pojo?.defaultDescription }
  get implies() { return this.#pojo?.implies }
  get normalize() { return this.#pojo?.normalize }
  get type() { return this.#pojo?.type }
}

export class CliYargsPositional extends CliYargsParameter {
  #pojo

  constructor(scope, name, pojo) {
    super(scope, name, pojo)

    this.#pojo = pojo
  }

  get position() { return this.#pojo.position }
  get isOptional() { return this.#pojo.isOptional }
  get isVariadic() { return this.#pojo.isVariadic }
}

export class CliYargsOption extends CliYargsParameter {
  #pojo

  constructor(scope, name, pojo) {
    super(scope, name, pojo)

    this.#pojo = pojo
  } 

  get demandOption() { return this.#pojo.isRequired }
  get global() { return !this.#pojo.isLocal }
  get hidden() { return this.#pojo.isHidden }
  get array() { return this.#pojo.isArray }
  get group() { return this.#pojo.group }
}

export class CliYargsCommand extends CliYargs {
  static fromInfoPojo(pojo) {
    return new CliYargsCommand(null, null, pojo)
  }

  static #sortByGroups(groups) {
    // 1. Reverse the input list and project just the group names
    const reversed = groups.map(([_, group]) => group).reverse()
  
    // 2. Build Set from reversed group names to dedupe in last-seen order
    const priority = [...new Set(reversed)].reverse()
  
    // 3. Sort the original list by group priority
    return groups.slice().sort((a, b) => {
      return priority.indexOf(a[1]) - priority.indexOf(b[1])
    });
  }

  #scope          // CliYargsCommand
  #pojo           // CliCommandInfo pojo
  #parameters     // array of CliYargsParameter
  #commands       // array of CliYargsCommand
  #template       // yargs command string
  #path           // path to command

  constructor(scope, name = '.', pojo) {
    super(name, pojo.description)
    
    this.#pojo = pojo
    this.#scope = scope

    this.#parameters = new Lazy(() => {
      const parameters = [ ]
      for (const [name, parameter] of Object.entries(pojo.parameters ?? { })) {
        // if (KNONWN_OPTIONS.includes(name))
        //   continue
        const kababName = parameter.kababName ?? name
        parameters.push(CliYargsParameter.create(this, kababName, parameter))
      }
      return parameters
    })

    this.#commands = new Lazy(() => {
      const commands = [ ]
      for (const [name, command] of Object.entries(pojo.commands ?? { })) {
        const kababName = command.kababName ?? name
        commands.push(new CliYargsCommand(this, kababName, command))
      }
      return commands
    })

    this.#template = new Lazy(() => {
      const positionals = [name]
      for (const positional of this.positionals()) {
        const variadic = positional.isVariadic ? '...' : ''
        const part = positional.isOptional 
          ? `[${positional.name}${variadic}]` 
          : `<${positional.name}${variadic}>`
        positionals.push(part)
      }

      return positionals.join(' ')
    })

    this.#path = new Lazy(() => {
      return [...this.hierarchy()]
        .reverse()
        .map(o => o.name)
        .filter(Boolean)
        .join(' ')
    })
  }

  *hierarchy() { 
    var scope = this
    while (scope) {
      yield scope
      scope = scope.scope
    }
  }

  get scope() { return this.#scope }
  get template() { return this.#template.value }
  get path() { return this.#path.value }
  get description() { return this.#pojo.description }
  get demandCommand() { 
    return this.#commands.value.length > 0 && !this.#pojo.isDefaultCommand
  }

  async #group(yargs$, argv) {
    let groups = []

    // hack; w/o this, suggestions are duplicated due to .exitProcess(false)
    // seems yargs() instances are not totally isolated when .exitProcess(false)
    if (argv.includes('--get-yargs-completions')) return yargs$

    await this.apply$(
      yargs(argv)
        .version(false)
        .help(false)
        .option('help', { alias: 'h' })
        .fail(() => { })
        .exitProcess(false),
      groups,
    ).then(yargs => yargs.parse())

    const sortedGroups = CliYargsCommand.#sortByGroups(groups)
    for (const [name, group] of sortedGroups)
      yargs$.group(name, group)

    return yargs$
  }

  async apply$(yargs, groups) {
    yargs.strict()

    if (this.demandCommand)
      yargs.demandCommand(1, 'You must specify a command.')

    for (const positional of this.positionals()) {
      const pojo = await positional.toPojo()
      yargs.positional(positional.name, pojo)
    }

    for (const option of [...this.options()].reverse()) {
      const name = option.name
      const { group, ...pojo } = await option.toPojo()
      groups?.unshift([name, group ? `Options (${group}):` : 'Options:'])
      if (KNONWN_OPTIONS.includes(name)) continue
      yargs.option(name, pojo)
    }

    for (const child of this.commands()) {
      yargs.command(
        child.template, 
        child.description, 
        o => child.apply$(o, groups),
      )
    }

    return yargs
  }

  async yargs$(argv) {
    return await this.apply$(
      yargs(argv)
        .version(false)
        .alias('help', 'h')
        .demandCommand(1, 'You must specify a command.')
        .showHelpOnFail(false, "Run --help for details.")
        .option('argv$', { hidden: true })
        .completion('completion')
        .middleware(async (argv) => {
          if (argv['argv$']) {
            const pojo = await toPojo(argv)
            await dumpPojo(pojo)
            process.exit(0)
          }
        })
    )
  }

  async yargs(argv = hideBin(process.argv)) {
    const yargs$ = yargs(argv)
    return await this.yargs$(argv)
      .then(yargs => this.#group(yargs, argv))
  }

  *commands() { yield* this.#commands.value }
  *parameters() { yield* this.#parameters.value }
  *positionals() {
    // inherited and declared positionals sorted by position
    yield* this.scope?.positionals() ?? []
    yield* this.#parameters.value
      .filter(o => o instanceof CliYargsPositional)
      .sort((a, b) => a.position - b.position) 
  }
  *options() { 
    // options sorted by name
    yield* this.#parameters.value
      .filter(o => o instanceof CliYargsOption)
  }
}
