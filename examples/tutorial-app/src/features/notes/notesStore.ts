import { indexNote } from "@/features/search";
import { readJson, writeJson } from "@/lib/storage";
import { pushNote } from "./notesApi";

export interface Note {
  id: string;
  title: string;
  body: string;
}

const notes = new Map<string, Note>(Object.entries(readJson<Record<string, Note>>("notes") ?? {}));

export const listNotes = (): Note[] => [...notes.values()];
export const getNote = (id: string): Note | undefined => notes.get(id);

export async function saveNote(note: Note): Promise<void> {
  notes.set(note.id, note);
  writeJson("notes", Object.fromEntries(notes));
  indexNote(note);
  await pushNote(note);
}
