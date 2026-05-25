# Model-Driven Default Arguments

This checkin extends the Partial metadata pipeline so default arguments can be
declared, reflected, and applied before proxy-side checks run.

The main default-argument invariant is:

- JavaScript signatures remain the runtime receiver contract.
- `[Defaults]` mirrors those signatures for Partial metadata.
- ArgChecks and Preconditions see the effective argument list after declared
  defaults are applied.
- Default metadata lives with the Part that declares the member.

That lets defaulted members such as `erase(first, last = next(first))`,
`eraseAfter(first, last = next(first, 2))`,
`insertValue(cursor = this.begin(), value)`, and
`resize(count, value = this.defaultValue$)` keep their natural JavaScript
signatures while still letting the Partial proxy validate the same effective
call shape.

The default mechanism supports procedural defaults through `defaultTo(...)`.
Those factories run left to right, can observe earlier defaulted arguments, and
can read the receiver. Literal function defaults remain literal values, not
factories.

The model work adds two views to the container Part model:

- Default Arguments: members with defaults pivoted by declaration Part.
- Non-Public Members: `$` members chip-pivoted by assert/abstract role, then
  pivoted by Part.

The non-public-member invariant is:

- `$` members are not public container surface.
- Assertion helpers are checked/debug vocabulary and belong with the Part that
  declares the reusable check.
- Abstract `$` members are implementation hooks and belong with the Part that
  requires the hook.
- Anything left in the remainder is intentionally visible pressure for a future
  model or metadata hook.
