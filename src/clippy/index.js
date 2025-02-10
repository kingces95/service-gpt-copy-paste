import _ from 'lodash'
import { Cli } from '@kingjs/cli'
// import CliYargs from '@kingjs/cli-yargs'
// import { cliInfoToPojo, toPojoSymbol } from '@kingjs/cli-info-to-pojo'
// import { CliMetaLoader } from '@kingjs/cli-meta-loader'

class Clippy extends Cli {
  static description = 'My funky cli'
  static commands = {
    orb: '@kingjs/cli-orb',
    poll: '@kingjs/cli-poll-clipboard',
    http: '@kingjs/cli-http',
    eval: '@kingjs/cli-eval',
    moo: {
      description: 'My moo command',
      commands: {
        foo: {
          description: 'My foo command',
          commands: {
            bar: '@kingjs/cli-http CliHttpGet',
            baz: '@kingjs/cli-http CliHttpGet',
          }
        },
      }
    },
  }
  static meta = Clippy.load()

  constructor(options = { }) {
    if (new.target.super(arguments, options))
      return super(Cli.loading)

    super(options)
  }
}

Clippy.__dumpLoader()

// const loader = new CliMetaLoader()
// const group = new CliGroupInfo(loader, metadata)

// const infoPojo = await cliInfoToPojo(group, { attachSource: true })
// console.log(JSON.stringify(infoPojo, null, 2))

// const yargsPojo = cliInfoPojoToYargs(infoPojo)
// console.log(JSON.stringify(yargsPojo, null, 2))

// const cli = new CliYargs(infoPojo)
// const { command: { [toPojoSymbol]: command }, args } = cli.parse()

// args[Cli.InfoSymbol] = command
// await command.run(args)

// node.exe src\clippy\index.js poll --error-rate .5 --poll-ms 1000 --stdis | node.exe src\clippy\index.js orb
