import parse from 'yargs'
import { hideBin } from 'yargs/helpers'
import CliLoader from '@kingjs/cli-loader'

export default class CliTree {
  static globalOptions(yargs) {
    yargs
      .middleware(CliTree.cleanKebabCaseMiddleware, true)
      .option('-yargs', {
        type: 'boolean',
        describe: 'Dump the yargs configuration as JSON',
        hidden: true,
      })
      .option('-??', {
        type: 'boolean',
        describe: 'Show hidden commands and options',
        hidden: true,
      })
      .middleware((argv) => {
        if (argv['?']) {
          const options = yargs.getOptions()
          
          // Clear the hidden flag for all options
          options.hiddenOptions = []
          
          // Show help with hidden options visible
          yargs.showHelp()
          process.exit(0)
        }
        if (argv.yargs) {
          console.log(JSON.stringify(argv, null, 2))
          process.exit(0)
        }
      }, true)
      .alias('?', '-??')
      .alias('h', 'help')
      .alias('v', 'version')

      // default options
      .group('h', 'Default Options:')
      .group('version', 'Default Options:')

      // hidden options
      .group('-yargs', 'Hidden Options:')
      .group('-??', 'Hidden Options:')
  }

  static cleanKebabCaseMiddleware(argv) {
    // Remove kebab-case keys, retaining only camelCase versions
    for (const key of Object.keys(argv)) {
      if (key.includes('-')) {
        delete argv[key]
      }
    }
  }

  static configure(yargs, name, member, context, bind) {
    if (typeof member === 'function') {
      CliTree.configureCommand(yargs, name, member, () => {
        bind({ name, member, context })
      })
    } else if (member instanceof CliTree) {
      CliTree.configureNamespace(yargs, name, member, () => {
        bind({ name, member, context })
      })
    }
  }

  static configureCommand(yargs, name, member, bind) {
    const metadata = CliLoader.getMetadata(member)
    yargs.command(
      name,
      metadata.description || '',
      (yargs) => {
        if (metadata.arguments) {
          for (const [argName, config] of Object.entries(metadata.arguments)) {
            yargs.positional(argName, config)
          }
        }
        if (metadata.options) {
          yargs.options(metadata.options)
          for (const [key] of Object.entries(metadata.options)) {
            yargs.group(key, 'Options:')
          }
        }
      },
      bind
    )
  }

  static configureNamespace(yargs, name, member, bind) {
    yargs.command(
      name,
      member.description,
      () => {},
      bind
    )
  }

  constructor({ defaultMember, members = {}, description = '' } = {}) {
    this.defaultMember = defaultMember
    this.members = members
    this.description = description
  }

  bind({ args = hideBin(process.argv), name = '.', context = [] } = {}) {
    let yargs = parse(args)
        
    context = [...context, name]
    let result = { }
    yargs = yargs.scriptName(context.join(' '))

    for (const [name, member] of Object.entries(this.members)) {
      CliTree.configure(yargs, name, member, context, () => {
        result = { context, name, member }
      })
    }

    if (this.defaultMember) {
      CliTree.configureCommand(yargs, '$0', this.defaultMember, () => {
        result = { context, member: this.defaultMember }
      })
    } else {
      yargs.demandCommand(1, 'You must specify a subcommand')
    }
    
    CliTree.globalOptions(yargs)

    const argv = yargs.argv 

    return { 
      ...result, 
      argv,
      args: result.name ? argv._.slice(1) : args
    }
  }
}
