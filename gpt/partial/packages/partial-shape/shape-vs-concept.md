# Shape vs Concept

## Concept

A `Concept` is certified. A type opts into it by composition.

Testing `instance instanceof Concept` means:

- the constructor is composed of the concept
- the instance still strictly matches the concept's required descriptor shape

## Shape

A `Shape` is observational. A random JS value can satisfy it if it appears to
have the right members.

Testing `value instanceof Shape` may:

- invoke getters
- trigger proxy traps
- observe changing state
- throw

## Rule of Thumb

Use `Concept` for internal, certified project protocols.

Use `Shape` for wild external JS values.

Use `Check` for argument/value constraints where custom errors and docs matter.
