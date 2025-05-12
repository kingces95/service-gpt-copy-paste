import {
  CliSubshell,
  CliInProcessSubshell,
  CliFunctionSubshell,
  CliBuiltinSubshell,
  CliProcessSubshell,
} from '@kingjs/cli-subshell'
import {
  CliResource,
} from '@kingjs/cli-resource'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojo } from '@kingjs/pojo'

const symbol = Symbol('cli-subshell-to-pojo')

CliResource[symbol] = {
  __type: 'string',
  __flow: 'string',
  __name: 'string',
  __path: 'string',
  __from: 'any',
  __to: 'any',
  fd: 'number',
  // hasFd: 'boolean',
  // isInput: 'boolean',
  // isOutput: 'boolean',
  parent: 'ref',
}

CliSubshell[symbol] = {
  __id: 'number',
  __type: 'string',
  // isInProcess: 'boolean',
  // isBuiltin: 'boolean',
  __slots: 'any'
}

CliInProcessSubshell[symbol] = {
  // name: 'string',
  ...CliSubshell[symbol],
}

CliFunctionSubshell[symbol] = {
  ...CliInProcessSubshell[symbol],
  __children: 'functors',
}

CliBuiltinSubshell[symbol] = {
  ...CliInProcessSubshell[symbol],
  __children: 'functors',
}

CliProcessSubshell[symbol] = {
  ...CliSubshell[symbol],
  cmd: 'string',
  args: 'list',
  __children: 'functors',
}

export async function cliSubshellToPojo(subshell) {
  let pojo = await toPojo(subshell, { symbol })
  return trimPojo(pojo)
}
