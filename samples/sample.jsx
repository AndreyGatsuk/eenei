import { useState } from "react";

// JSX expressions and template interpolation should remain readable.
export function ProjectCard({ project }) {
  const [open, setOpen] = useState(false);
  const label = `Project: ${project.name ?? "Untitled"}`;
  return (
    <article className={open ? "expanded" : "compact"}>
      {/* A JSX comment, not ordinary text. */}
      <button onClick={() => setOpen(!open)}>{label}</button>
      {open && <p>{project.description}</p>}
    </article>
  );
}
