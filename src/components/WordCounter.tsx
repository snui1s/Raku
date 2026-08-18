import { Editor } from "@tiptap/react";
import { FileText, Clock, AlignLeft } from "lucide-react";
import { useState, useMemo } from "react";

interface WordCounterProps {
  editor: Editor | null;
}

export function WordCounter({ editor }: WordCounterProps) {
  const [compact, setCompact] = useState(false);

  const stats = useMemo(() => {
    if (!editor) return { words: 0, characters: 0, readingTime: 0 };

    const text = editor.getText();
    const trimmed = text.trim();

    if (!trimmed) {
      return { words: 0, characters: 0, readingTime: 0 };
    }

    // Thai character detection
    const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
    
    // English word list (separated by whitespace)
    const englishWords = trimmed
      .replace(/[\u0E00-\u0E7F]+/g, " ") // remove thai block for english word count
      .split(/\s+/)
      .filter(Boolean).length;

    // Thai word estimation (~4 characters per Thai word)
    const estimatedThaiWords = Math.round(thaiChars / 4);

    // Total words
    const words = Math.max(1, englishWords + estimatedThaiWords);
    const characters = text.length;

    // Reading time calculation:
    // English: ~200 words / min
    // Thai: ~500 characters / min
    const englishMinutes = (englishWords / 200);
    const thaiMinutes = (thaiChars / 500);
    const totalMinutes = englishMinutes + thaiMinutes;

    const readingTime = Math.max(1, Math.ceil(totalMinutes));

    return { words, characters, readingTime };
  }, [editor?.state.doc]); // Recalculate on document content changes

  if (!editor) return null;

  return (
    <div className="fixed bottom-4 right-6 z-30">
      <button
        onClick={() => setCompact(!compact)}
        className="px-3 py-1.5 rounded-full backdrop-blur-md bg-app-toolbar border border-app-border text-xs text-app-muted hover:text-app-text shadow-md transition-all flex items-center gap-2 group cursor-pointer hover:border-accent/40"
        title="Click to toggle detailed stats"
      >
        <FileText size={13} className="text-accent opacity-80 group-hover:scale-110 transition-transform" />
        
        {compact ? (
          <span className="font-medium font-mono">{stats.words} words</span>
        ) : (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <AlignLeft size={11} className="opacity-60" />
              <strong className="font-semibold text-app-text">{stats.words}</strong> words
            </span>
            <span className="opacity-30">•</span>
            <span>
              <strong className="font-semibold text-app-text">{stats.characters}</strong> chars
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="opacity-60" />
              <span>{stats.readingTime} min read</span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
