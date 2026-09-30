import { request } from "@/lib/http";
import type { Note } from "./notesStore";

export const pushNote = (note: Note) =>
  request(`/api/notes/${note.id}`, { method: "PUT", body: note });
