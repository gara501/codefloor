import type { CodefloorDoc } from "@codefloor/schema";
import { useEffect, useState } from "react";
import { readSelection, readView, type Selection, toParams, type ViewMode } from "./selection";

interface State {
  view: ViewMode;
  selection: Selection;
}

function fromLocation(doc: CodefloorDoc): State {
  const params = new URLSearchParams(window.location.search);
  return { view: readView(params), selection: readSelection(params, doc) };
}

/** View + selection, optionally mirrored to the URL (?view, ?node, ?flow, ?step). */
export function useSelectionState(doc: CodefloorDoc, urlState: boolean) {
  const [state, setState] = useState<State>(() =>
    urlState ? fromLocation(doc) : { view: "list", selection: null },
  );

  useEffect(() => {
    if (!urlState) return;
    const onPop = () => setState(fromLocation(doc));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [urlState, doc]);

  // Selection changes push history; view switches and stepping replace it.
  function write(view: ViewMode, selection: Selection, replace = false) {
    setState({ view, selection });
    if (!urlState) return;
    const qs = toParams(view, selection).toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  return { ...state, write };
}
