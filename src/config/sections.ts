// Provisional section list. Final set is decided together later.
export const sections = ["hero", "skills", "projects", "contact"] as const;
export type SectionId = (typeof sections)[number];
