import type { CodefloorDoc } from "@codefloor/schema";

export interface ExtractDiff {
  added: string[];
  removed: string[];
  changed: string[];
  edgesAdded: string[];
  edgesRemoved: string[];
}

const importEdges = (doc: CodefloorDoc) =>
  new Set(doc.edges.filter((e) => e.kind === "imports").map((e) => `${e.from}->${e.to}`));

/** What changed between a saved document and a fresh extraction. Only import edges are compared. */
export function diffDocs(prev: CodefloorDoc, next: CodefloorDoc): ExtractDiff {
  const prevIds = new Set(prev.nodes.map((n) => n.id));
  const nextIds = new Set(next.nodes.map((n) => n.id));
  const prevHash = prev.meta?.sources ?? {};
  const nextHash = next.meta?.sources ?? {};
  const prevEdges = importEdges(prev);
  const nextEdges = importEdges(next);
  const sorted = (xs: Iterable<string>) => [...xs].sort();
  return {
    added: sorted([...nextIds].filter((id) => !prevIds.has(id))),
    removed: sorted([...prevIds].filter((id) => !nextIds.has(id) && id in prevHash)),
    changed: sorted([...nextIds].filter((id) => prevIds.has(id) && prevHash[id] !== nextHash[id])),
    edgesAdded: sorted([...nextEdges].filter((e) => !prevEdges.has(e))),
    edgesRemoved: sorted([...prevEdges].filter((e) => !nextEdges.has(e))),
  };
}
