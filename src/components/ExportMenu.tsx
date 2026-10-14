import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Download,
  FileText,
  FileCode,
  Check,
  Loader2,
  DatabaseBackup,
  Upload,
} from "lucide-react";
import JSZip from "jszip";
import { readFile, writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { Note } from "../hooks/useNotes";
import { createBackup, restoreBackup } from "../services/backup";

interface ExportMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeNote: Note | null;
  editor: Editor | null;
}

// Convert TipTap HTML / DOM to clean Markdown string
function convertHtmlToMarkdown(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  function parseNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(parseNode).join("");

    switch (tagName) {
      case "h1":
        return `# ${children.trim()}\n\n`;
      case "h2":
        return `## ${children.trim()}\n\n`;
      case "h3":
        return `### ${children.trim()}\n\n`;
      case "h4":
        return `#### ${children.trim()}\n\n`;
      case "p":
        return `${children.trim()}\n\n`;
      case "strong":
      case "b":
        return `**${children}**`;
      case "em":
      case "i":
        return `*${children}*`;
      case "u":
        return `<u>${children}</u>`;
      case "s":
      case "del":
      case "strike":
        return `~~${children}~~`;
      case "code":
        if (el.parentElement?.tagName.toLowerCase() === "pre") {
          return children;
        }
        return `\`${children}\``;
      case "pre":
        return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
      case "blockquote":
        return `> ${children.trim()}\n\n`;
      case "ul":
        return `${children}\n`;
      case "ol":
        return `${children}\n`;
      case "li":
        const isTask = el.getAttribute("data-type") === "taskItem";
        const isChecked = el.getAttribute("data-checked") === "true";
        if (isTask) {
          return `- [${isChecked ? "x" : " "}] ${children.trim()}\n`;
        }
        return `- ${children.trim()}\n`;
      case "img":
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "image";
        return `![${alt}](${src})\n\n`;
      case "hr":
        return `---\n\n`;
      case "br":
        return `\n`;
      default:
        return children;
    }
  }

  return Array.from(div.childNodes).map(parseNode).join("").trim();
}

export function ExportMenu({
  open,
  setOpen,
  activeNote,
  editor,
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setExportSuccess(null);
      setErrorMsg(null);
    }
  }, [open]);

  const noteTitle = activeNote?.title || "Untitled";
  const sanitizeFilename = (name: string) =>
    name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "Untitled";

  // Browser fallback link download
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Direct save to User's Downloads folder
  const saveToDownloads = async (blob: Blob, filename: string) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      await writeFile(filename, buffer, { baseDir: BaseDirectory.Download });
      return true;
    } catch (err) {
      console.warn("Direct save to Downloads failed, falling back to browser download link:", err);
      triggerDownload(blob, filename);
      return false;
    }
  };

  // 1. EXPORT MARKDOWN (.md / ZIP with images)
  const handleExportMarkdown = async () => {
    if (!editor || !activeNote) return;
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const html = editor.getHTML();
      let markdownText = convertHtmlToMarkdown(html);

      // Find all image tags
      const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const images: { fullMatch: string; alt: string; src: string }[] = [];
      let match;

      while ((match = imgRegex.exec(markdownText)) !== null) {
        images.push({ fullMatch: match[0], alt: match[1], src: match[2] });
      }

      if (images.length === 0) {
        // No images -> Save pure .md file directly to Downloads
        const blob = new Blob([markdownText], {
          type: "text/markdown;charset=utf-8;",
        });
        const filename = `${sanitizeFilename(noteTitle)}.md`;
        await saveToDownloads(blob, filename);
        setExportSuccess(`Saved to Downloads/${filename}`);
      } else {
        // Has images -> Export as ZIP containing Note.md + images/ folder directly to Downloads
        const zip = new JSZip();
        const imgFolder = zip.folder("images");

        let updatedMarkdown = markdownText;

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const src = img.src;

          let filename = `image_${i + 1}.png`;
          let imageBuffer: Uint8Array | null = null;

          if (src.startsWith("local-image:")) {
            // Read from Tauri AppData FS
            const relativePath = src.replace("local-image:", "");
            filename = relativePath.split("/").pop() || filename;
            try {
              imageBuffer = await readFile(relativePath, {
                baseDir: BaseDirectory.AppData,
              });
            } catch (err) {
              console.error("Failed to read image from AppData:", err);
            }
          } else if (src.startsWith("data:image/")) {
            // Base64 Data URL
            const matches = src.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1];
              const base64Data = matches[2];
              filename = `image_${i + 1}.${ext}`;
              const binaryStr = atob(base64Data);
              imageBuffer = new Uint8Array(binaryStr.length);
              for (let j = 0; j < binaryStr.length; j++) {
                imageBuffer[j] = binaryStr.charCodeAt(j);
              }
            }
          }

          if (imageBuffer && imgFolder) {
            imgFolder.file(filename, imageBuffer);
            updatedMarkdown = updatedMarkdown.replace(
              img.fullMatch,
              `![${img.alt}](./images/${filename})`
            );
          }
        }

        // Add Markdown file to root of ZIP
        const mdFilename = `${sanitizeFilename(noteTitle)}.md`;
        zip.file(mdFilename, updatedMarkdown);

        // Generate ZIP & Save to Downloads
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFilename = `${sanitizeFilename(noteTitle)}.zip`;
        await saveToDownloads(zipBlob, zipFilename);
        setExportSuccess(`Saved to Downloads/${zipFilename}`);
      }
    } catch (err) {
      console.error("Failed to export Markdown:", err);
      alert("Failed to export Markdown. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  // 2. EXPORT PDF (.pdf directly to Downloads & print fallback)
  const handleExportPDF = async () => {
    if (!editor || !activeNote) return;
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const htmlContent = editor.getHTML();
      const textContent = editor.getText();

      // Convert local-image URLs to Base64
      const div = document.createElement("div");
      div.innerHTML = htmlContent;
      const imgElements = div.querySelectorAll("img");

      for (const img of Array.from(imgElements)) {
        const src = img.getAttribute("src") || "";
        if (src.startsWith("local-image:")) {
          const relativePath = src.replace("local-image:", "");
          try {
            const buffer = await readFile(relativePath, {
              baseDir: BaseDirectory.AppData,
            });
            const ext = relativePath.split(".").pop() || "png";
            const base64 = btoa(
              Array.from(buffer)
                .map((byte) => String.fromCharCode(byte))
                .join("")
            );
            img.setAttribute("src", `data:image/${ext};base64,${base64}`);
          } catch (e) {
            console.error("Failed to convert image for PDF:", e);
          }
        }
      }

      const printableHtml = div.innerHTML;

      // 1. Generate & Save PDF file directly into Downloads folder
      const pdfFilename = `${sanitizeFilename(noteTitle)}.pdf`;
      
      // Construct a clean PDF 1.4 file
      const encoder = new TextEncoder();
      const sanitize = (str: string) => str.replace(/[\\()]/g, "\\$&");
      const lines = textContent.split("\n").filter((l) => l.trim().length > 0);

      let streamText = "BT\n/F1 18 Tf\n50 780 Td\n";
      streamText += `(${sanitize(noteTitle)}) Tj\n0 -28 Td\n/F1 11 Tf\n`;

      let y = 740;
      for (const line of lines) {
        if (y < 40) break;
        const chunks = line.match(/.{1,75}/g) || [line];
        for (const chunk of chunks) {
          if (y < 40) break;
          streamText += `(${sanitize(chunk)}) Tj\n0 -16 Td\n`;
          y -= 16;
        }
      }
      streamText += "ET\n";

      const streamBytes = encoder.encode(streamText);
      const streamLen = streamBytes.length;

      const pdfHeader = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
`;
      const pdfFooter = `endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

      const pdfBlob = new Blob(
        [encoder.encode(pdfHeader), streamBytes, encoder.encode(pdfFooter)],
        { type: "application/pdf" }
      );

      // Save directly to Downloads folder!
      await saveToDownloads(pdfBlob, pdfFilename);

      // 2. Also trigger Print dialog via hidden iframe for full HTML/Image printing
      let iframe = document.getElementById("raku-pdf-print-iframe") as HTMLIFrameElement;
      if (iframe) iframe.remove();

      iframe = document.createElement("iframe");
      iframe.id = "raku-pdf-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${noteTitle}</title>
              <style>
                @page { size: auto; margin: 15mm; }
                body { font-family: 'Inter', sans-serif; color: #1c1c1e; padding: 10px; max-width: 800px; margin: 0 auto; }
                h1 { font-size: 2.2rem; font-weight: 800; border-bottom: 2px solid #f25c54; padding-bottom: 8px; }
                img { max-width: 100%; height: auto; border-radius: 8px; margin: 14px 0; }
              </style>
            </head>
            <body>
              <h1>${noteTitle}</h1>
              ${printableHtml}
            </body>
          </html>
        `);
        doc.close();
      }

      setExportSuccess(`Saved directly to Downloads/${pdfFilename}!`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackup = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setErrorMsg(null);
    try {
      const { blob, filename } = await createBackup();
      triggerDownload(blob, filename);
      setExportSuccess(`Backup saved: ${filename}`);
    } catch (err) {
      console.error("Backup failed:", err);
      setErrorMsg("Backup failed. See console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async (file: File) => {
    if (
      !window.confirm(
        "Restore from this backup? Notes in the backup are added to your current notes (same notes are overwritten). Nothing is deleted."
      )
    ) {
      return;
    }
    setIsExporting(true);
    setExportSuccess(null);
    setErrorMsg(null);
    try {
      const count = await restoreBackup(file);
      setExportSuccess(`Restored ${count} notes`);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error("Restore failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Restore failed");
      setIsExporting(false);
    }
  };

  const canExport = !!editor && !!activeNote && !isExporting;
  const item =
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-app-text transition-colors hover:bg-app-tertiary disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 active:scale-90 hover:bg-app-tertiary ${
          open ? "bg-app-tertiary text-app-text" : "text-app-muted hover:text-app-text"
        }`}
        title="Export & Backup"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={17} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl border border-app-border bg-app-dropdown backdrop-blur-xl shadow-2xl z-[100] raku-pop"
        >
          <div className="px-3 pt-2 pb-1 text-[0.625rem] font-bold uppercase tracking-widest text-app-muted">
            Export note
          </div>
          <button role="menuitem" onClick={handleExportMarkdown} disabled={!canExport} className={item}>
            <FileCode size={16} className="text-app-muted" />
            <span className="flex-1">Markdown</span>
            <span className="text-[0.6875rem] font-mono text-app-muted">.md / .zip</span>
          </button>
          <button role="menuitem" onClick={handleExportPDF} disabled={!canExport} className={item}>
            <FileText size={16} className="text-app-muted" />
            <span className="flex-1">PDF</span>
            <span className="text-[0.6875rem] font-mono text-app-muted">.pdf</span>
          </button>

          <div className="my-1.5 h-px bg-app-border" />

          <div className="px-3 pt-1 pb-1 text-[0.625rem] font-bold uppercase tracking-widest text-app-muted">
            All notes
          </div>
          <button role="menuitem" onClick={handleBackup} disabled={isExporting} className={item}>
            <DatabaseBackup size={16} className="text-app-muted" />
            <span className="flex-1">Backup</span>
            <span className="text-[0.6875rem] font-mono text-app-muted">.zip</span>
          </button>
          <button
            role="menuitem"
            onClick={() => fileRef.current?.click()}
            disabled={isExporting}
            className={item}
          >
            <Upload size={16} className="text-app-muted" />
            <span className="flex-1">Restore</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) handleRestore(f);
            }}
          />

          {(isExporting || exportSuccess || errorMsg) && (
            <div
              className={`mt-1.5 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
                errorMsg
                  ? "bg-red-500/10 text-red-500"
                  : "bg-app-tertiary text-app-muted"
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 size={13} className="animate-spin text-accent" />
                  Working...
                </>
              ) : errorMsg ? (
                errorMsg
              ) : (
                <>
                  <Check size={13} className="text-accent shrink-0" />
                  <span className="truncate">{exportSuccess}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
