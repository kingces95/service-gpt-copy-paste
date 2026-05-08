# Simple Type Restrictions

## Original Idea

XSD simple types can derive from other simple types by restriction.

Original style:

```xml
<xs:simpleType name="Byte">
  <xs:restriction base="xs:integer">
    <xs:minInclusive value="0"/>
    <xs:maxInclusive value="255"/>
  </xs:restriction>
</xs:simpleType>
```

XSD also has lists, unions, enumerations, patterns, and length facets.

## Local Translation

The local equivalent is a future `Check` hierarchy with `[Restrictions]`.

Example style:

```js
export class NonNegativeInteger extends IntegerType {
  static [Restrictions] = [
    MinInclusive(0),
  ]
}

export class Byte extends NonNegativeInteger {
  static [Restrictions] = [
    MaxInclusive(255),
  ]
}
```

Use in function metadata:

```js
writeByte[Preconditions] = [
  Byte,
]
```

## Why It Matters

Restrictions give named constraints runtime behavior, documentation identity,
and derivation. This fits the metadata-first style better than anonymous POJO
validation languages once good error messages and docs matter.
