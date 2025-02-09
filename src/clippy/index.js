import _ from 'lodash'
import CliYargs from '@kingjs/cli-yargs'
import { cliInfoToPojo, toPojoSymbol } from '@kingjs/cli-info-to-pojo'
import { Cli } from '@kingjs/cli'
import { CliLoader } from '@kingjs/cli-loader'
import { CliGroupInfo } from '@kingjs/cli-info'

import { CliBashEval, CliCmdEval } from '@kingjs/cli-eval'
import { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } from '@kingjs/cli-http'
import CliOrb from '@kingjs/cli-orb'
import CliPollClipboard from '@kingjs/cli-poll-clipboard'

class Clippy extends Cli {
  static description = 'My funky cli'
  static commands = [
    '@kingjs/cli-orb',
    '@kingjs/cli-poll-clipboard',
    '@kingjs/cli-http',
    '@kingjs/cli-eval',
  ]
  static info = Clippy.load()

  constructor(options = { }) {
    if (Cli.isLoading(arguments) || Clippy.saveDefaults(options))
      return super(Cli.loading)

    super(options)
  }
}

const metadata = {
  description$: 'My funky cli',
  // http: {
  //   description$: 'Group of http commands',
  //   get: '@kingjs/cli-http CliGet',
  //   post: '@kingjs/cli-http CliPost',
  //   put: '@kingjs/cli-http CliPut',
  //   delete: '@kingjs/cli-http CliDelete',
  //   patch: '@kingjs/cli-http CliPatch',
  //   head: '@kingjs/cli-http CliHead',
  // },
  // http2: {
  //   get: CliGet,
  //   post: CliPost,
  //   put: CliPut,
  //   delete: CliDelete,
  //   patch: CliPatch,
  //   head: CliHead,
  // },
  // moo: {
  //   foo: {
  //     bar: CliGet,
  //     baz: CliGet,
  //   },
  // },
  // eval2: {
  //   description$: 'Group of shell evaluation commands',
  //   bash: '@kingjs/cli-eval CliBashEval',
  //   cmd: '@kingjs/cli-eval CliCmdEval',
  // },
  // eval: {
  //   description$: 'Group of shell evaluation commands',
  //   // bash: CliBashEval,
  //   cmd: CliCmdEval,
  // },
  get: CliGet,
  // orb: '@kingjs/cli-orb',
  // poll: '@kingjs/cli-poll-clipboard',
  // reflect: CliReflect,
}

const loader = new CliLoader()
const group = new CliGroupInfo(loader, metadata)

const infoPojo = await cliInfoToPojo(group, { attachSource: true })
// console.log(JSON.stringify(infoPojo, null, 2))

// const yargsPojo = cliInfoPojoToYargs(infoPojo)
// console.log(JSON.stringify(yargsPojo, null, 2))

const cli = new CliYargs(infoPojo)
const { command: { [toPojoSymbol]: command }, args } = cli.parse()

// args[Cli.InfoSymbol] = command
await command.run(args)

// node.exe src\clippy\index.js poll --error-rate .5 --poll-ms 1000 --stdis | node.exe src\clippy\index.js orb
