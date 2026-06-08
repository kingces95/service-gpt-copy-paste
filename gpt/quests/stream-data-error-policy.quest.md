# Stream Data Error Policy

Distinguish programmer contract failures from malformed external data.

## Impetus

Unicode BOM handling introduced stream policy where well-formed client code can
encounter bad source bytes:

```text
explicit byteOrder + conflicting BOM
required BOM + absent BOM
forbidden BOM + present BOM
```

Those are not client API misuse. They should throw ordinary data errors rather
than assertion failures.

## Policy

```text
assert
└─ invalid API shape, impossible internal state, bad option combinations

throw Error
└─ malformed external data, invalid encoded stream content, parse failures
```

## Sweep

Audit cursor-container-unicode, unicode, cursor-container-ranges, and parser-like
packages for asserts that guard source bytes, code units, code points, records,
or other external stream data. Convert those to named helpers or ordinary
errors, leaving constructor option validation and internal invariants as asserts.
