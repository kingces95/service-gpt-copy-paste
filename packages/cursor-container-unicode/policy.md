# Cursor Container Unicode Policy

## Byte Order Mark

UTF code unit containers normalize an optional stream prefix before code units
are exposed. A byte order mark is treated as stream metadata, not as a
projected value. Once enough source bytes have been pushed to decide the
policy, a present BOM is consumed from the underlying byte range and the
resolved byte order is recorded on the container.

The policy is driven by three options:

```txt
byteOrder        auto | big | little
bom              optional | required | forbidden | resolved
defaultByteOrder big | little
```

```txt
auto + optional
├─ BOM present: consume BOM, use BOM order
├─ no BOM once decidable: use defaultByteOrder
└─ insufficient bytes: expose no units yet

auto + required
├─ BOM present: consume BOM, use BOM order
├─ no BOM once decidable: reject
└─ insufficient bytes: expose no units yet

explicit + optional
├─ BOM present and matches: consume BOM
├─ BOM present and conflicts: reject
└─ no BOM once decidable: use explicit byteOrder

explicit + forbidden
├─ BOM present: reject
└─ no BOM once decidable: use explicit byteOrder

explicit + resolved
├─ do not inspect or consume leading bytes
└─ use explicit byteOrder
```
