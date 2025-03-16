import _ from 'lodash'
import yargs from 'yargs'
import { Lazy } from '@kingjs/lazy'
import { Cli } from '@kingjs/cli'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { dumpPojo } from '@kingjs/pojo-dump'
import { toPojo } from '@kingjs/pojo'

async function __import() {
  const { cliYargsToPojo } = await import('@kingjs/cli-yargs-to-pojo')
  return { toPojo: cliYargsToPojo }
}

const KNONWN_OPTIONS = [
  'help', 'version'
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
}

export class CliYargsCommand extends CliYargs {
  static fromInfoPojo(pojo) {
    return new CliYargsCommand(null, null, pojo)
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
        if (KNONWN_OPTIONS.includes(name))
          continue
        parameters.push(CliYargsParameter.create(this, name, parameter))
      }
      return parameters
    })

    this.#commands = new Lazy(() => {
      const commands = [ ]
      for (const [name, command] of Object.entries(pojo.commands ?? { })) {
        commands.push(new CliYargsCommand(this, name, command))
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
      return [...this.hierarchy()].reverse().map(o => o.name).join(' ')
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

  async apply(yargs) {
    yargs.strict()

    if (this.demandCommand)
      yargs.demandCommand(1, 'You must specify a command.')

    for (const positional of this.positionals()) {
      yargs.positional(positional.name, await positional.toPojo())
    }

    for (const option of this.options()) {
      yargs.option(option.name, await option.toPojo())
      // yargs.group(name, `Options (${group}):`)
    }

    for (const child of this.commands()) {
      yargs.command(
        child.template, 
        child.description, 
        child.apply.bind(child),
      )
    }

    return yargs
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
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}

export async function cliYargs(classOrPojo, options = { }) {
  const { metadata } = options
  const isClass = typeof classOrPojo == 'function'
  const class$ = isClass ? classOrPojo : Cli.extend(classOrPojo)
  const cachedMetadata = CliClassMetadata.fromMetadataPojo(
    metadata ?? await (await CliClassMetadata.fromClass(class$)).toPojo()
  )
  const info = CliCommandInfo.fromMetadata(cachedMetadata)
  const yargsCommand = CliYargsCommand.fromInfoPojo(await info.toPojo())
  
  const yargs$ = yargs()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 'You must specify a command.')
    .showHelpOnFail(false, "Run --help for details.")
    .option('argv$', { hidden: true })
    .middleware(async (argv) => {
      if (argv['argv$']) {
        const pojo = await toPojo(argv)
        await dumpPojo(pojo)
        process.exit(0)
      }
    })
    .middleware(async (argv) => ({ 
      _root: class$,
      _class: await class$.getCommand(argv._),
      _info: await info.getCommand(argv._),
    }))
    .middleware(async (argv) => { 
      const _args = []

      const command = await info.getCommand(argv._)
      Object.defineProperty(argv, '_command', { value: command, enumerable: false })

      const parameters = [...CliCommandInfo.runtimeParameters(command)]
      parameters.filter(o => o.isPositional)
        .sort((a, b) => a.position - b.position)
        .reduce((acc, { name }) => {
          acc.push(argv[name])
          return acc
        }, _args)

      _args.push({ 
        _root: argv._root,
        _class: argv._class,
        _info: argv._info,
      })

      parameters.filter(o => o.isOption)
        .reduce((acc, { name }) => {
          if (Object.hasOwn(argv, name))
            acc[name] = argv[name]
          return acc
        }, _args.at(-1))

      return { _args }
    })


  return yargsCommand.apply(yargs$)
}

