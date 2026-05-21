# Shape vs Concept

## Concept

A `Concept` is nominal and certified. A type opts into it with `implement`.

Testing `instance instanceof Concept` means:

- the constructor is composed of the concept
- the concept appears in the normal meta-prototype chain
- the instance still strictly matches the concept's required descriptor shape

## Shape

A `Shape` is structural and type-level. A type satisfies it with `satisfy`.

Testing `instance instanceof Shape` means:

- the instance's constructor prototype structurally matches the shape
- the shape does not appear as nominal composition on ordinary types
- the result can be cached because descriptor structure is fixed after type
  construction

## Probe

A `Probe` is observational and value-level.

Testing `value instanceof Probe` may inspect live properties, invoke getters, or
trigger proxy traps. Probe results are not cached as type structure.

## Rule of Thumb

Use `Concept` for nominal public protocols.

Use `Shape` for STL-ish structural requirements over project types.

Use `Probe` for wild external JavaScript values.
