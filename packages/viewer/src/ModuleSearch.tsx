import type { ArchNode } from "@codefloor/schema";
import { type KeyboardEvent, type Ref, useId, useState } from "react";
import { cn } from "./cn";

const MAX_RESULTS = 8;

export interface ModuleSearchProps {
  nodes: ArchNode[];
  onSelect: (id: string) => void;
  ref?: Ref<HTMLInputElement>;
}

/** Search modules by label, id or file; picking one selects it. */
export function ModuleSearch({ nodes, onSelect, ref }: ModuleSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  const needle = query.trim().toLowerCase();
  const results = needle
    ? nodes
        .filter((n) =>
          [n.label, n.id, ...(n.files ?? [])].some((v) => v.toLowerCase().includes(needle)),
        )
        .slice(0, MAX_RESULTS)
    : [];
  const open = results.length > 0;
  const active = Math.min(activeIndex, results.length - 1);

  function pick(id: string) {
    onSelect(id);
    setQuery("");
    setActiveIndex(0);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && open) {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp" && open) {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const hit = results[active];
      if (hit) pick(hit.id);
    } else if (event.key === "Escape") {
      setQuery("");
      event.currentTarget.blur();
    }
  }

  return (
    <div className="cf-relative">
      <input
        ref={ref}
        type="search"
        role="combobox"
        aria-label="Search modules"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        placeholder="Search modules  /"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={onKeyDown}
        className="cf-input"
      />
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Matching modules"
          className="cf-popover cf-popover--search"
        >
          {results.map((node, index) => (
            <div
              key={node.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              tabIndex={-1}
              // mousedown so the pick lands before the input blurs
              onMouseDown={(e) => {
                e.preventDefault();
                pick(node.id);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn("cf-option", index === active && "cf-option--active")}
            >
              <span className="cf-strong">{node.label}</span>
              {node.files?.[0] && (
                <span className="cf-mono cf-muted cf-block cf-truncate">{node.files[0]}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
