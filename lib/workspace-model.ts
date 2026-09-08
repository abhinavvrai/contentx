export const WORKFLOW_STAGES = ["draft", "internal_review", "client_review", "changes_requested", "approved"] as const;
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
export function stringIds(value: unknown, limit = 100): string[] {
  if (!Array.isArray(value) || value.length > limit) throw new Error(`Choose at most ${limit} items.`);
  const ids = [...new Set(value.map(item => text(item, 80)))];
  if (ids.some(id => !/^[a-zA-Z0-9_-]+$/.test(id))) throw new Error("An item reference is invalid.");
  return ids;
}
export function assetDetails(value: Record<string, unknown>) {
  const dueAt = value.dueAt ? Number(value.dueAt) : null;
  if (dueAt !== null && (!Number.isSafeInteger(dueAt) || dueAt < 0)) throw new Error("Choose a valid deadline.");
  const custom: Record<string, string> = {};
  if (value.custom && typeof value.custom === "object" && !Array.isArray(value.custom)) {
    const entries = Object.entries(value.custom);
    if (entries.length > 12) throw new Error("Use at most 12 custom fields.");
    for (const [key, entry] of entries) {
      const label = text(key, 40);
      if (!label || ["__proto__", "constructor", "prototype"].includes(label)) throw new Error("Choose a valid field name.");
      custom[label] = text(entry, 200);
    }
  }
  return { platform: text(value.platform, 60), campaign: text(value.campaign, 100), editor: text(value.editor, 100),
    status: WORKFLOW_STAGES.includes(value.status as typeof WORKFLOW_STAGES[number]) ? value.status : "draft",
    dueAt, tags: Array.isArray(value.tags) ? [...new Set(value.tags.map(tag => text(tag, 32)).filter(Boolean))].slice(0, 12) : [], custom };
}
export function savedView(value: Record<string, unknown>) {
  return { query: text(value.query, 120), type: ["all", "video", "audio", "image", "feedback", "versions"].includes(String(value.type)) ? value.type : "all",
    sort: ["newest", "name", "size"].includes(String(value.sort)) ? value.sort : "newest", folderId: text(value.folderId, 80),
    collectionId: text(value.collectionId, 80), status: WORKFLOW_STAGES.includes(value.status as typeof WORKFLOW_STAGES[number]) ? value.status : "all" };
}
export const PROJECT_TEMPLATES: Record<string, string[]> = {
  reels: ["01 Brief", "02 Footage", "03 Audio", "04 Cuts", "05 Delivery"],
  podcast: ["01 Recording", "02 Audio", "03 Episode", "04 Social clips", "05 Delivery"],
  longform: ["01 Script", "02 Footage", "03 B-roll", "04 Graphics", "05 Cuts", "06 Delivery"],
  advert: ["01 Brief", "02 Brand assets", "03 Footage", "04 Variations", "05 Delivery"],
};
