# @codefloor/schema

Types, JSON Schema and a zero-dependency validator for [codefloor](../../README.md) documents.

```ts
import { validate, type CodefloorDoc } from "@codefloor/schema";

const result = validate(json);
if (!result.ok) console.error(result.errors); // [{ path: "nodes[2].layer", message: "unknown layer \"ui\"" }]
```

Pass `{ fileExists }` to also check that every non-glob `files` entry exists. The JSON Schema is exported as `@codefloor/schema/schema.json` for editors and other tools.
