# Thunks

## Original Idea

Method interception: wrap a method call so metadata-driven behavior can run
before and after the original function.

Roots:

- design by contract
- C# attribute/AOP-style interception
- decorators

## Local Model

`PartialProxy` provides `[CreateThunk]`.

When `partial-reflector` copies a descriptor to a class that supports
`CreateThunk`, the descriptor can be replaced by a generated wrapper.

The wrapper runs:

- type preconditions
- member preconditions
- original method/getter/setter
- member postconditions
- type postconditions

## Why This Matters

It lets concepts and partial classes contribute behavior that is not just
members, but rules around members.

This is also the conceptual ancestor of the later `function-contract` package
for standalone functions.
