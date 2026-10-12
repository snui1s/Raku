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

// Image files on disk that no note references (safe to delete)
export const findOrphanImages = (
  fileNames: string[],
  noteContents: string[]
): string[] => {
  const all = noteContents.join("\n");
  return fileNames.filter((name) => !all.includes(name));
};
