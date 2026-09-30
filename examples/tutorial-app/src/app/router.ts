import { renderEditorPage } from "@/pages/EditorPage";
import { renderNotesPage } from "@/pages/NotesPage";

export function startRouter(root: HTMLElement): void {
  const render = () => {
    const id = new URLSearchParams(location.search).get("note");
    root.replaceChildren(id ? renderEditorPage(id) : renderNotesPage());
  };
  window.addEventListener("popstate", render);
  render();
}
