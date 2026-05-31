# Normalize Partial Family Protocol

Partial families describe their own declaration protocol. A family names the
declarative symbol that hosts its adjacent declarations, the procedural verb
that applies the same relation when one exists, and the normalization rule that
turns declaration input into a family member.

```txt
Family
├─ Declarative
├─ Procedural
├─ Normalize
└─ Adjacent
```

`Adjacent` is a list of accepted adjacent families. The declaration symbol is
recovered from each adjacent family, so declaration edges stay 1-1 with family
protocol.

The invariant is that declaration input is valid when the adjacent family can
normalize it and prove it belongs to that family.

Shape remains deliberately ordinary in this pass: no special declaration rule is
baked into the normalizer. The open question of whether Shape should flatten
into a strict duck surface or preserve a requirement graph is captured as a
quest.
