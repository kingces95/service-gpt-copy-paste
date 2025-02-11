import {
  CliMetadata,
  CliParameterMetadata,
  CliClassMetadata,
  CliMetadatLoader
} from '@kingjs/cli-metadata'
import { trimPojo } from '@kingjs/pojo-trim'
import { toPojoSymbol, toPojo } from '@kingjs/pojo'

CliMetadatLoader[toPojoSymbol] = {
  classes: 'infos',
}

CliMetadata[toPojoSymbol] = {
  name: 'string',
  description: 'string',
}

CliClassMetadata[toPojoSymbol] = {
  ...CliMetadata[toPojoSymbol],
  parameters: 'infos',
  commands: 'any',
}

CliParameterMetadata[toPojoSymbol] = {
  ...CliMetadata[toPojoSymbol],

  default: 'any',

  type: 'string',
  require: 'boolean',
  local: 'boolean',
  hide: 'boolean',
  position: 'number',
  aliases: 'list',
  choices: 'list',
  conflicts: 'list',
  implications: 'list',

  // coerce, defaultDescription, normalize
}

export async function cliMetadataToPojo(meta) {
  let pojo = await toPojo(meta)

  if (meta instanceof CliMetadatLoader)
    pojo = pojo.classes
  
  return trimPojo(pojo)
}
