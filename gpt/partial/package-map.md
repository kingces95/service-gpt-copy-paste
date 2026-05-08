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

`partial-concept` defines certified runtime concepts.

`partial-shape` defines loose observational duck types.

## Verbs

`partial-define` copies transparent attachments.

`partial-extend` composes partial classes.

`partial-implement` composes concepts and their implementations.

## Runtime

`partial-proxy` wraps members with pre/postcondition thunks.
