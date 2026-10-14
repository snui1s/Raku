// Realistic synthetic notes for benchmarks (Tiptap JSON, ~3 KB each, mixed Thai/English).
import { randomUUID } from "node:crypto";

const words =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua สวัสดี โน้ต จดบันทึก โปรเจกต์ ประชุม รายการ".split(
    " "
  );

const sentence = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => words[(seed * 7 + i * 13) % words.length]).join(" ");

export interface BenchNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  folderId: string | null;
}

export function makeContent(seed: number, imageName?: string): string {
  const text = (t: string) => ({ type: "text", text: t });
  const para = (t: string) => ({ type: "paragraph", content: [text(t)] });
  const nodes: unknown[] = [
    { type: "heading", attrs: { level: 1 }, content: [text(`Note ${seed} ${sentence(3, seed)}`)] },
    para(sentence(40, seed)),
    para(sentence(55, seed + 1)),
    { type: "heading", attrs: { level: 2 }, content: [text(sentence(4, seed + 2))] },
    {
      type: "bulletList",
      content: [1, 2, 3, 4].map((i) => ({
        type: "listItem",
        content: [para(sentence(8, seed + i))],
      })),
    },
    para(sentence(60, seed + 3)),
  ];
  if (imageName) nodes.push({ type: "image", attrs: { src: `local-image:images/${imageName}` } });
  return JSON.stringify({ type: "doc", content: nodes });
}

export function makeNotes(count: number, folders = 20): BenchNote[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `note-${i}`,
    title: `Note ${i} ${sentence(3, i)}`,
    content: makeContent(i, i % 10 === 0 ? `${randomUUID()}.png` : undefined),
    createdAt: now - i * 60000,
    updatedAt: now - i * 30000,
    isPinned: i % 50 === 0,
    folderId: i % 5 === 0 ? null : `folder-${i % folders}`,
  }));
}
