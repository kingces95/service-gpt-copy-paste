import _ from 'lodash'
import { Cli } from '@kingjs/cli'
import { CliLoader } from '@kingjs/cli-loader'
import { CliGroupInfo } from '@kingjs/cli-info'
import { CliBashEval, CliCmdEval } from '@kingjs/cli-eval'
import { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } from '@kingjs/cli-http'
import CliOrb from '@kingjs/cli-orb'
import CliPollClipboard from '@kingjs/cli-poll-clipboard'
import toPojoSymbol from '@kingjs/cli-node'
import CliYargs from '@kingjs/cli-yargs'

class CliReflect extends Cli {
  constructor({ ...rest }) {
    super(rest)

    console.log(this.info.parent[toPojoSymbol]())
  }
}

const metadata = {
  http: {
    get: CliGet,
    post: CliPost,
    put: CliPut,
    delete: CliDelete,
    patch: CliPatch,
    head: CliHead
  },
  moo: {
    foo: {
      bar: CliGet,
      baz: CliGet,
    },
  },
  eval: {
    description$: 'Group of shell evaluation commands',
    bash: CliBashEval,
    cmd: CliCmdEval
  },
  orb: CliOrb,
  poll: CliPollClipboard,
  reflect: CliReflect,
}

const loader = new CliLoader()
const group = new CliGroupInfo(loader, metadata)
const pojo = group[toPojoSymbol]({ attachSource: true })
// console.log(JSON.stringify(group[toPojoSymbol](), null, 2))
const cli = new CliYargs(pojo)
const { command: { [toPojoSymbol]: command }, args } = cli.parse()
args[Cli.InfoSymbol] = command
command.run(args)
