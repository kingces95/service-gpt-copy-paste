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
      if (!name.endsWith('$')) {
        loader.load(name, node)
      }
    }

    loader.run()
  }
}

class CliLoader {

  static getMetadata(node) {
    let metadata = { options: {} }

    if (typeof node === 'function') {
      // Traverse the prototype chain to collect and merge metadata
      let currentClass = node
      while (currentClass) {
        if (currentClass.metadata) {
          metadata = merge({}, currentClass.metadata, metadata)
        }
        currentClass = Object.getPrototypeOf(currentClass)
      }
      metadata.isCliClass = true
    } else if (typeof node === 'object' && node !== null) {
      metadata.description = node.description$ || 'Group of subcommands'
      metadata.isCliClass = false
    }

    return metadata
  }

  constructor(args, namespace = 'cli') {
    this.args = args
    this.yargs = yargs(args)
    this.yargs.scriptName(namespace)
    this.namespace = namespace
  }

  load(name, node) {
    const metadata = CliLoader.getMetadata(node)

    this.yargs.command(
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
        }
      },
      (args) => {
        if (metadata.isCliClass) {
          console.log(args)
          //CliRuntime.entrypoint(node, args)
        } else {
          console.log(args)
          const subArgs = [...this.args]
          subArgs.unshift(name)
          CliShim.run(node, subArgs, `${this.namespace} ${name}`)
        }
      }
    )
  }

  run() {
    let args = this.yargs.demandCommand(1, 'You must specify a subcommand').argv
  }
}

export { CliShim, CliLoader }
