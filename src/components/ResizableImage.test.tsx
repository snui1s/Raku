// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

vi.mock("@tiptap/react", () => ({
  NodeViewWrapper: ({ children, className }: { children: unknown; className?: string }) => (
    <div className={className}>{children as never}</div>
  ),
}));

const readFile = vi.fn();
vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: (...args: unknown[]) => readFile(...args),
  BaseDirectory: { AppData: 1 },
}));

import type { NodeViewProps } from "@tiptap/react";
import { ResizableImage } from "./ResizableImage";

const props = (src: string) =>
  ({
    node: { attrs: { src, width: null, alt: "" } },
    selected: false,
    updateAttributes: vi.fn(),
  }) as unknown as NodeViewProps;

let created: string[];
const revoke = vi.fn();

beforeEach(() => {
  created = [];
  readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:test/${created.length}`;
    created.push(url);
    return url;
  });
  URL.revokeObjectURL = revoke;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ResizableImage local images", () => {
  it("revokes its blob URL when the image is removed", async () => {
    const { unmount } = render(<ResizableImage {...props("local-image:a.png")} />);
    await waitFor(() => expect(created).toHaveLength(1));
    expect(revoke).not.toHaveBeenCalled();
    unmount();
    expect(revoke).toHaveBeenCalledWith(created[0]);
  });

  it("revokes the old blob URL when the source changes", async () => {
    const { rerender } = render(<ResizableImage {...props("local-image:a.png")} />);
    await waitFor(() => expect(created).toHaveLength(1));
    rerender(<ResizableImage {...props("local-image:b.png")} />);
    await waitFor(() => expect(created).toHaveLength(2));
    expect(revoke).toHaveBeenCalledWith(created[0]);
  });

  it("does not create a blob URL if it was removed before the file was read", async () => {
    let finish: (bytes: Uint8Array) => void = () => {};
    readFile.mockReturnValue(new Promise<Uint8Array>((r) => (finish = r)));
    const { unmount } = render(<ResizableImage {...props("local-image:a.png")} />);
    unmount();
    finish(new Uint8Array([1]));
    await Promise.resolve();
    await Promise.resolve();
    expect(created).toHaveLength(0);
  });
});
