import type { Organization } from "../../domain/ports/IOrganizationRepository";

let idCounter = 1;

export function buildOrganization(overrides: Partial<Organization> = {}): Organization {
  const id = overrides.id ?? idCounter++;
  return {
    name: "Test Organization",
    logo: "https://example.com/logo.png",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
    id,
  };
}

export function buildManyOrganization(
  count: number,
  overrides?: Partial<Organization>,
): Organization[] {
  return Array.from({ length: count }, (_, i) =>
    buildOrganization({ ...overrides, id: overrides?.id ?? i + 1 }),
  );
}
