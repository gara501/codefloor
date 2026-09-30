import { listNotes } from "@/features/notes";
import { search } from "@/features/search";

export function renderNotesPage(query = ""): HTMLElement {
  const list = document.createElement("ul");
  const notes = query ? search(query) : listNotes();
  for (const note of notes) {
    const item = document.createElement("li");
    item.textContent = note.title;
    list.append(item);
  }
  return list;
}
