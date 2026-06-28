# Flatten Projected Unicode Containers

This work continues the bash-style `read` emulator path by reducing the
Unicode/range stack to fewer, clearer moving parts.

Projected containers now share one projected cursor and one projected range
container backbone. Fixed-stride and variable-stride projection classes are no
longer first-class types; their former behavior is expressed directly by the
containers that know the policy. UTF-8 and UTF-16 code points own continuation
trimming and stepping. Byte-ordered containers own byte-width stepping. UTF-32
code points use the base one-source-value projection.

Stream metadata is handled at stream boundaries. `UnicodeActivator` consumes
Unicode preambles and activates the concrete code-point container. UTF-8 code
point containers no longer strip signatures themselves; they assume activated,
clean UTF-8 source bytes. UTF-16/32 byte-order logic stays with byte-ordered
containers and concrete BE/LE unit containers.

Range containers now own the split sugar directly. `RangeContainerPart` hosts
`splitAt` and `split`, because splitting is just a pop followed by activating a
fresh instance of the same type and replaying the popped ranges. The separate
splittable part was only ceremony.

Partial composition behavior is pinned for future loader work. The completed
member-ownership quest is marked done, and the remaining override-discipline
question is split into its own quest: should the loader reject repeated concrete
overrides that mix component composition with inheritance composition?

## Notes

The important invariant is that byte provenance remains intact while the class
hierarchy shrinks. Flattening removes policy aliases, not byte accounting.

The direct code-point containers remain default constructable, which keeps
`split` simple and prepares for the next part/field work.

The current loader behavior where a Part's own default can be reapplied over an
override is intentionally pinned before changing it.
