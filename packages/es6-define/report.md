# ES6 Define

```txt
Syntax Descriptor Mapping
├─ function name / class name
│  ├─ value
│  ├─ writable: false
│  ├─ enumerable: false
│  └─ configurable: true
├─ method() { }
│  ├─ value
│  ├─ writable: true
│  ├─ enumerable: false
│  └─ configurable: true
├─ get value() { }
│  ├─ get
│  ├─ enumerable: false
│  └─ configurable: true
├─ set value(value) { }
│  ├─ set
│  ├─ enumerable: false
│  └─ configurable: true
└─ field
   ├─ value
   ├─ writable: true
   ├─ enumerable: true
   └─ configurable: true
```
