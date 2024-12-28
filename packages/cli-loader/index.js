import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import url from 'url'
import path from 'path'
import merge from 'lodash.merge'
import CliRuntime from '@kingjs/cli-runtime'

class CliShim {

  static runIf(mainUrl, ctor) {
    if (url.fileURLToPath(mainUrl) === path.resolve(process.argv[1])) {
      CliShim.run({ '$0': ctor })
    }
  }

  static run(classes, args = hideBin(process.argv), namespace) {
    const loader = new CliLoader(args, namespace)

    for (const [name, node] of Object.entries(classes)) {
      loader.loadTree(name, node)
    }

    loader.run()
  }
}

class CliLoader {

  static getMetadata(CliClass) {
    let metadata = {}

    // Traverse the prototype chain to collect and merge metadata
    let currentClass = CliClass
    while (currentClass) {
      if (currentClass.metadata) {
        metadata = merge({}, currentClass.metadata, metadata)
      }
      currentClass = Object.getPrototypeOf(currentClass)
    }

    return metadata
  }

  constructor(args, namespace = 'cli') {
    this.args = args
    this.yargs = yargs(args)
    this.yargs.scriptName(namespace)
    this.namespace = namespace
  }

  loadTree(name, node) {
    if (typeof node === 'function') {
      this.load(name, node)
    } else {
      this.yargs.command(
        name,
        'Group of subcommands',
        () => {},
        (args) => {
          const subArgs = args._.slice(1) // Pass remaining subcommand arguments
          CliShim.run(node, subArgs, `${this.namespace} ${name}`)
        }
      )
    }
  }

  load(name, CliClass) {
    const metadata = CliLoader.getMetadata(CliClass)

    this.yargs.command(
      name === '$0' ? metadata.command : [name, metadata.command].filter(Boolean).join(' '),
      metadata.description || '',
      (yargs) => {
        if (metadata.arguments) {
          for (const [argName, config] of Object.entries(metadata.arguments)) {
            yargs.positional(argName, config)
          }
        }
        if (metadata.options) {
          yargs.options(metadata.options)
        }
      },
      (args) => {
        CliRuntime.entrypoint(CliClass, args)
      }
    )
  }

  run() {
    this.yargs.demandCommand(1, 'You must specify a subcommand').help().argv
  }
}

export { CliShim, CliLoader }
