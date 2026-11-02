export interface Project {
  readonly id: string;
  name: string;
  archived?: boolean;
}

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

/** Parse external data before storing it. */
export function parseProject(input: unknown): Result<Project> {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: new Error("Expected an object") };
  }
  if (!("id" in input) || typeof input.id !== "string") {
    return { ok: false, error: new Error("Missing project ID") };
  }

  // The name is optional in older API responses.
  const name = "name" in input ? String(input.name) : "Untitled";
  return { ok: true, value: { id: input.id, name } };
}

const limits = { retries: 3, timeout: 5_000 } as const;
export const timeout: number = limits.timeout;
