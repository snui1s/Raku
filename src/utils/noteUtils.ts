// Pure helpers for note content (Tiptap JSON strings). Kept free of Tauri imports
// so they can be unit tested.

// Get title from content (first line or "Untitled")
export const extractTitle = (content: string): string => {
  try {
    const json = JSON.parse(content);
    const firstNode = json?.content?.[0];
    if (firstNode?.content?.[0]?.text) {
      const text = firstNode.content[0].text.trim();
      return text.slice(0, 50) || "Untitled";
    }
  } catch {
    // ignore
  }
  return "Untitled";
};

// Does Tiptap JSON content contain any actual text?
export const hasTextContent = (content: string): boolean => {
  try {
    const json = JSON.parse(content);
    const checkNode = (node: any): boolean => {
      if (node.text && node.text.trim().length > 0) return true;
      if (node.content && Array.isArray(node.content)) {
        return node.content.some(checkNode);
      }
      return false;
    };
    return checkNode(json);
  } catch {
    return false;
  }
};

// Images are saved as <uuid>.<ext>. Matching on the uuid (any extension) keeps the check
// safe for odd extensions and lets us scan every note once instead of once per file.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Image files on disk that no note references (safe to delete)
export const findOrphanImages = (
  fileNames: string[],
  noteContents: string[]
): string[] => {
  const referenced = new Set<string>();
  for (const content of noteContents) {
    for (const m of content.matchAll(UUID_RE)) referenced.add(m[0].toLowerCase());
  }

  // Files whose name is not uuid-shaped fall back to a plain substring check
  let joined: string | null = null;

  return fileNames.filter((name) => {
    const uuid = name.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuid) return !referenced.has(uuid[0].toLowerCase());
    joined ??= noteContents.join("\n");
    return !joined.includes(name);
  });
};
