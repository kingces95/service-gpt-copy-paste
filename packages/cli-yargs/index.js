import _ from 'lodash'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

export default class CliYargs {
  static symbol = Symbol('CliYargs.MemberInfo')

  static buildCommand(name, positionals = []) {
    const parts = [name];

    for (const positional of positionals) {
      const isOptional = positional.type === 'array' || positional.default !== undefined;
      const part = isOptional ? `[${positional.name}...]` : `<${positional.name}>`;
      parts.push(part);
    }

    return parts.join(' ');
  }

  static buildPositional(positional) {
    return {
      alias: positional?.aliases,
      choices: positional?.choices,
      coerce: positional?.coerce,
      conflicts: positional?.conflicts,
      default: positional?.default,
      defaultDescription: positional?.defaultDescription,
      description: positional?.description,
      implies: positional?.implies,
      normalize: positional?.normalize,
      type: positional?.type,
    };
  }

  static buildOption(option) {
    return {
      alias: option?.aliases,
      choices: option?.choices,
      coerce: option?.coerce,
      conflicts: option?.conflicts,
      default: option?.default,
      defaultDescription: option?.defaultDescription,
      describe: option?.description,
      implies: option?.implies,
      normalize: option?.normalize,
      type: option?.type,

      boolean: option?.type === 'boolean',
      count: option?.type === 'count',
      demandOption: option?.demandOption,
      global: option?.global,
      hidden: option?.hidden,
      number: option?.type === 'number',
      string: option?.type === 'string',
    };
  }

  static loadPositionals(yargs$, context) {
    for (const [_, pojo] of context) {
      for (const positional of pojo.positionals ?? []) {
        yargs$.positional(positional.name, CliYargs.buildPositional(positional));
      }
    }
  }

  static loadGroups(yargs$, context) {
    const [[_, pojo], ...restContext] = context;

    // First set of options with no modifier
    for (const [name, option] of Object.entries(pojo.options ?? {})) {
      yargs$.option(name, CliYargs.buildOption(option));
    }

    // Group the remaining options by their parent
    for (const [parentName, parentPojo] of restContext) {
      for (const [name] of Object.entries(parentPojo.options ?? {})) {
        yargs$.group(name, `Options (${parentName})`);
      }
    }
  }

  static load(yargs$, pojo, name = 'global', parentContext = []) {
    const context = [[name, pojo], ...parentContext];

    // load positionals
    CliYargs.loadPositionals(yargs$, context);

    // load options
    CliYargs.loadGroups(yargs$, context);

    // load groups
    for (const [name, group] of Object.entries(pojo.groups ?? {})) {
      yargs$.command(
        `${name} <command>`,
        group.description || '<missing group description>',
        (subYargs) => CliYargs.load(subYargs, group, name, context),
        (argv) => argv[CliYargs.memberInfoSymbol] = group
      );
    }

    // load commands
    for (const [name, command] of Object.entries(pojo.commands ?? {})) {
      yargs$.command(
        CliYargs.buildCommand(name, pojo.positionals),
        command.description || '<missing command description>',
        (subYargs) => CliYargs.load(subYargs, command, name, context),
        (argv) => argv[CliYargs.memberInfoSymbol] = command
      );
    }
  }

  constructor(pojo) {
    this.yargs$ = yargs()
      .demandCommand(1, `You need to specify a command`);

    CliYargs.load(this.yargs$, pojo);
  }

  parse(argv = hideBin(process.argv)) {
    var args = this.yargs$.parse(argv);
    var command = args[CliYargs.memberInfoSymbol];
    delete args[CliYargs.memberInfoSymbol];
    return { command, args };
  }
}

