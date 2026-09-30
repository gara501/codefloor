# @codefloor/viewer

The interactive explorer for [codefloor](../../README.md) documents, as a React component.

```tsx
import { Codefloor } from "@codefloor/viewer";
import "@codefloor/viewer/codefloor.css";

<Codefloor data={doc} theme="system" urlState />;
```

Peer dependencies: `react` and `react-dom` 19.2+. Theme colors are `--cf-*` CSS variables on `.cf-root`; override them to match your app.
