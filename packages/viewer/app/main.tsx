import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Codefloor } from "../src";
import { loadDoc } from "./loadDoc";

const root = createRoot(document.getElementById("root") as HTMLElement);

loadDoc().then((result) => {
  if (result.ok && typeof result.doc === "object" && result.doc && "name" in result.doc) {
    document.title = `${String(result.doc.name)} · codefloor`;
  }
  root.render(
    <StrictMode>
      {result.ok ? (
        <Codefloor data={result.doc} urlState theme="system" />
      ) : (
        <p style={{ fontFamily: "system-ui", padding: 24 }}>{result.message}</p>
      )}
    </StrictMode>,
  );
});
