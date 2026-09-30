import type { Note } from "@/features/notes";

const index = new Map<string, Note>();

export function indexNote(note: Note): void {
  index.set(note.id, note);
}

export function search(query: string): Note[] {
  const needle = query.toLowerCase();
  return [...index.values()].filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(needle));
}
