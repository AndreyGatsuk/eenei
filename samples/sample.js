/** Load active projects from an API. */
export async function loadProjects(baseUrl, { signal } = {}) {
  const response = await fetch(`${baseUrl}/projects`, { signal });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const projects = await response.json();
  // Keep names readable even when the API omits them.
  return projects
    .filter(({ archived }) => !archived)
    .map(({ id, name }) => ({ id, name: name?.trim() || "Untitled" }));
}

export class ProjectCache {
  #entries = new Map();

  get(id) {
    return this.#entries.get(id) ?? null;
  }

  set(project) {
    if (!/^[a-z\d-]+$/i.test(project.id)) return false;
    this.#entries.set(project.id, project);
    return true;
  }
}

class BaseProject {
  constructor(name) { this.name = name; }
}

export class NamedProject extends BaseProject {
  constructor(name) { super(name); }
}

export function adjustCount(count, limit) {
  count++;
  count--;
  count += 2;
  const smaller = count < limit;
  return smaller ? count : limit;
}

