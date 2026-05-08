# Transparent Partials

## Original Idea

Some descriptor groups are implementation detail. After they are copied, the
host should not be considered "composed of" that descriptor group.

This is analogous to inline metadata or an attribute constructor argument: it
contributes data but does not become an ancestor/interface of the target.

## Local Model

`Attachments` and `AbstractAttachments` are transparent.

Transparent partials:

- can be created from POJOs
- are compiled and copied
- are not published as adjacent partial types
- are considered to belong logically to the non-transparent host that declared
  them

## Why This Matters

This keeps reflection meaningful. A target composed with `EditableContainerPart`
should report that part. It should not report every inline `{ push() { ... } }`
override object as a conceptual ancestor.
