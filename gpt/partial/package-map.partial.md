# Partial Package Map

## Core

`partial-symbols` defines the shared symbol vocabulary.

`partial-type` defines `PartialType`, the abstract root for class-shaped
descriptor metadata.

`partial-reflector` builds the meta-prototype chain and copies descriptors.

`partial-reflect` exports a configured reflector and `copyTo`.

`partial-metadata` projects static metadata and conditions across the composed
partial chain.

## Partial Kinds

`partial-attachments` defines transparent descriptor bundles.

`partial-class` defines implementation/capability parts.

`partial-concept` defines certified nominal runtime concepts.

`partial-shape` defines structural type-level requirements.

`partial-satisfy` copies shapes and shape implementations onto types.

Loose observational duck checks moved to `probe`; see
[Shape to Probe](../notes/2026-05-20-001-shape-to-probe.notes.md).

## Verbs

`partial-define` copies transparent attachments.

`partial-extend` composes partial classes.

`partial-implement` composes concepts and their implementations.

`partial-satisfy` composes shapes and their implementations.

## Runtime

`partial-proxy` wraps members with pre/postcondition thunks.
