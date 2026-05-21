# Reflection and Attributes

## Original Idea

C# can attach metadata to declarations and inspect it at runtime.

Original style:

```csharp
[Description("Output format")]
public string Output { get; set; }

var attrs = property.GetCustomAttributes();
```

Attributes can drive docs, validation, UI, serialization, and tooling.

## Attribute Data Types

C# custom attributes deliberately restrict what can appear in attribute
metadata. Attribute constructor arguments and named properties must be made from
simple, reflectable values such as:

- primitive values
- strings
- enums
- `System.Type`
- one-dimensional arrays of valid attribute argument types

Original style:

```csharp
[Command(
  Name = "copy",
  Type = typeof(CopyCommand),
  Aliases = new[] { "cp" },
  Hidden = false)]
public class CopyCommand { }
```

The important idea is that attribute metadata is not arbitrary runtime object
state. It is a constrained, inspectable data block attached to a declaration.

## Local Translation

The local equivalent is static metadata plus loaders and reflection-to-POJO
projections.

Example style:

```js
export class CliOutputService extends CliServiceProvider {
  static description = 'Output format'
  static parameters = {
    output: 'Output format',
    query: 'JMESPath query string',
  }
  static choices = {
    output: {
      json: MODULE_NAME.addExport('json'),
      table: MODULE_NAME.addExport('table'),
    },
  }
}
```

Metadata loaders then turn the declarations into command help, validation, and
runtime activation data.

The local metadata vocabulary is intentionally similar in spirit to C# custom
attribute data:

- primitives
- strings
- arrays
- POJOs
- types/classes
- symbols as attachment points

Example style:

```js
export const Parameters = Symbol('Cli.Parameters')
export const Produces = Symbol('Cli.Produces')

export class CopyCommand extends CliCommand {
  static [Parameters] = {
    source: String,
    target: String,
    overwrite: Boolean,
  }

  static [Produces] = [
    JsonRecord,
  ]
}
```

In practice, this repo often attaches metadata with static fields or static
symbol-keyed fields:

```js
class MyConcept extends Concept {
  static [Defines] = {
    throwIfInvalid() { }
  }
}
```

Symbol keys make the metadata channel explicit and avoid collisions with normal
user-facing members. Loaders can then interpret the metadata while reflection
tools can document it.

This also explains a recurring style preference: make the metadata itself the
artifact. Avoid hiding it behind fluent builders when a declaration made from
types, arrays, POJOs, primitives, and symbols can remain readable and
reflectable.

## Why It Matters

Runtime reflection is a project priority. TypeScript can help authors, but it
does not preserve enough metadata for `--help`, AI discovery, workflow docs, or
runtime validation.
