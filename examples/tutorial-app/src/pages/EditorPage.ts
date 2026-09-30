import { getNote, saveNote } from "@/features/notes";

export function renderEditorPage(id: string): HTMLElement {
  const area = document.createElement("textarea");
  area.value = getNote(id)?.body ?? "";
  area.addEventListener("change", () => {
    void saveNote({ id, title: area.value.split("\n")[0] ?? "", body: area.value });
  });
  return area;
}
