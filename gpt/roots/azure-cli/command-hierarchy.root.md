# Command Hierarchy

## Original Idea

Azure CLI exposes nested command groups with consistent help and option
behavior.

Original style:

```bash
az storage account list --output table
az storage blob upload --account-name acct --container-name c --file f
az storage blob --help
```

The UX emphasizes discoverability:

- group commands by noun/category
- inherit common options
- provide consistent `--help`
- group related options
- support output controls

## Local Translation

The local equivalent is the `cli-*` metadata and yargs pipeline.

Example style:

```js
export class RootCommand extends CliCommand {
  static commands = {
    storage: StorageCommand,
  }
}

export class StorageCommand extends CliCommand {
  static commands = {
    blob: BlobCommand,
  }
}
```

Services and groups add az-like cross-cutting options:

```js
static groups = [
  ['output format', CliOutputService],
]
```

## Why It Matters

AI and humans both need discoverable command surfaces. A nested command tree
with consistent help lets an assistant learn new capabilities by running
`--help`.
