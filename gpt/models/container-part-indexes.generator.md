# Container Part Indexes Generator

Regenerates the column-grid reports in [container-part.model.md](container-part.model.md):

```txt
Members
└─ members pivoted by ~role and declaring Part, with container support columns

Member Index
└─ flattened member rows, with container support columns

Lexeme Index
└─ member-name lexemes pivoted by lexeme, with container support columns
```

The source data lives in [container-part-indexes.data.js](data/container-part-indexes.data.js).
The generator lives in [generate-container-part-indexes.js](scripts/generate-container-part-indexes.js).

```txt
Inputs
├─ container order
├─ Part support by container
├─ ~role grouping
├─ public members introduced by each Part
└─ flattened public member names

Formatting
├─ fixed-width row label column
├─ one narrow column per container
├─ vertical guide line under every container name
├─ x means supported
└─ - means absent
```

Run from the repository root:

```powershell
node gpt/models/scripts/generate-container-part-indexes.js all
```

The script writes generated sections to stdout. It does not read or mutate
[container-part.model.md](container-part.model.md). Insert generated output with
a normal patch.

```powershell
node gpt/models/scripts/generate-container-part-indexes.js members
node gpt/models/scripts/generate-container-part-indexes.js member-index
node gpt/models/scripts/generate-container-part-indexes.js lexeme-index
```
