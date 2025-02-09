import {
  CliLoaderInfo,
  CliClassParameterInfo,
  CliClassInfo,
  CliLoader
} from '@kingjs/cli-loader'

import { toPojoSymbol, mapToPojo } from '@kingjs/to-pojo'

CliLoader[toPojoSymbol] = {
  classes: 'map',
}

CliLoaderInfo[toPojoSymbol] = {
  name: 'string',
  description: 'string',
}

CliClassInfo[toPojoSymbol] = {
  ...CliLoaderInfo[toPojoSymbol],
  parameters: 'map',
}

CliClassParameterInfo[toPojoSymbol] = {
  ...CliLoaderInfo[toPojoSymbol],

  default: 'any',

  type: 'string',
  require: 'boolean',
  position: 'number',
  aliases: 'list',
  choices: 'list',
  conflicts: 'list',
  implies: 'list',

  // coerce, defaultDescription, normalize
}

function cliLoaderToPojo(loader, ...args) {
  return mapToPojo(loader.classes(), ...args)
}

export {
  cliLoaderToPojo,
}