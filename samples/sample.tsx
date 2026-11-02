import { useState } from "react";

interface Project {
  id: string;
  name: string;
  archived: boolean;
}

/** A small list with filtering and an empty state. */
export function ProjectList({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const visible = projects.filter(
    (project) => !project.archived && project.name.includes(query),
  );

  return (
    <section aria-labelledby="projects-title">
      <h1 id="projects-title">Projects</h1>
      {/* Filtering happens locally. */}
      <input
        aria-label="Filter projects"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {visible.length === 0 ? <p>No projects found.</p> : (
        <ul>
          {visible.map(({ id, name }) => <li key={id}>{name}</li>)}
        </ul>
      )}
    </section>
  );
}
