# Partial Override Discipline

Quest:

Reject confusing repeated concrete overrides in the partial loader.

See also:

- [partial-member-ownership.quest.md](partial-member-ownership.quest.md)

Impetus:

While squashing the projected range container work, `ProjectedRangePart` briefly
owned defaults for stepping and trimming. Concrete projection containers then
composed the same Part again with explicit overrides, but the Part's own
defaults could be reattached later and mask the override. Moving the defaults to
`ProjectedRangeContainer` fixed the design by choosing inheritance for the
default and component composition for the override.

Pinned current behavior:

```txt
default specialization behavior
├─ concrete base implementation beats inherited derived default
│  └─ pinned by partial-compose/regression/default-specialization.test.js
└─ own default reapplies if the same Part is composed again
   └─ pinned by partial-compose/regression/default-specialization.test.js
```

Future rule to explore:

```txt
compose(Type, Part, impl)
├─ may fill abstract members
├─ may specialize default members once
└─ should reject overriding an already concrete non-default member
```

This is not because no precedence rule can be invented. It is because repeated
overrides usually signal that component composition and inheritance composition
are being mixed in the same axis. Prefer flattening the hierarchy or choosing a
single owner for the member.

Potential loader assert:

```txt
if target already has a concrete non-default descriptor for member
and compose(Type, Part, impl/default) wants to attach another concrete descriptor
then reject unless the member is explicitly marked overrideable
```

Try the assert experimentally. If it fires in current code, treat the callsite as
a design smell first and redesign before adding escape hatches.
