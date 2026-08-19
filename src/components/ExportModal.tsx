import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Download, FileText, FileCode, X, Check, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { readFile, writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { Note } from "../hooks/useNotes";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote: Note | null;
  editor: Editor | null;
  isDark?: boolean;
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

export function ExportModal({
  isOpen,
  onClose,
  activeNote,
  editor,
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen || !activeNote || !editor) return null;

  const noteTitle = activeNote.title || "Untitled";
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="p-6 rounded-2xl shadow-2xl max-w-md w-full bg-app-dropdown border border-app-border text-app-text relative transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-app-muted hover:text-app-text hover:bg-app-tertiary transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-accent-muted text-accent">
            <Download size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Export Note</h2>
            <p className="text-xs text-app-muted truncate max-w-[260px]">
              {noteTitle}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <Check size={14} />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Export Format Options */}
        <div className="space-y-3 mb-6">
          {/* 1. Markdown Export Option */}
          <button
            onClick={handleExportMarkdown}
            disabled={isExporting}
            className="w-full p-4 rounded-xl border border-app-border bg-app-tertiary/50 hover:bg-app-tertiary hover:border-accent/50 transition-all text-left flex items-start gap-3.5 group cursor-pointer disabled:opacity-50"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <FileCode size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Markdown (.md / ZIP)</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">
                  .md / .zip
                </span>
              </div>
              <p className="text-xs text-app-muted mt-1 leading-relaxed">
                Includes all images in a zip package. Perfect for Obsidian, Notion & VS Code.
              </p>
            </div>
          </button>

          {/* 2. PDF Export Option */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="w-full p-4 rounded-xl border border-app-border bg-app-tertiary/50 hover:bg-app-tertiary hover:border-accent/50 transition-all text-left flex items-start gap-3.5 group cursor-pointer disabled:opacity-50"
          >
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">PDF Document (.pdf)</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500">
                  .pdf
                </span>
              </div>
              <p className="text-xs text-app-muted mt-1 leading-relaxed">
                Formatted document with images and styles. Ideal for printing & sharing.
              </p>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[11px] text-app-muted pt-3 border-t border-app-border/50">
          <span>Choose a format to download</span>
          {isExporting && (
            <span className="flex items-center gap-1.5 text-accent font-medium">
              <Loader2 size={12} className="animate-spin" />
              Exporting...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
