import _ from 'lodash'
import { Cli } from '@kingjs/cli'
import { CliLoader } from '@kingjs/cli-loader'
import { CliGroupInfo } from '@kingjs/cli-info'
import { CliBashEval, CliCmdEval } from '@kingjs/cli-eval'
import { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } from '@kingjs/cli-http'
import CliPollClipboard from '@kingjs/cli-poll-clipboard'
import toPojoSymbol from '@kingjs/cli-node'
import CliYargs from '@kingjs/cli-yargs'

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
  poll: CliPollClipboard
}

class CliReflect extends Cli {
  constructor({ signal }) {
    super(signal)
  }
}

const loader = new CliLoader()
const group = new CliGroupInfo(loader, metadata)
const pojo = group[toPojoSymbol]()
//console.log(JSON.stringify(group[toPojoSymbol](), null, 2))
const cli = new CliYargs(pojo)
const { command: { [toPojoSymbol]: command }, args } = cli.parse()
command.run(args)
