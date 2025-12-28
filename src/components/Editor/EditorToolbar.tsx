import { Editor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Bold,
  Italic,
  Strikethrough,
  Underline,
  ChevronDown,
  Highlighter,
  Palette,
  Type,
  ALargeSmall,
} from "lucide-react";
import { useState } from "react";
import { AVAILABLE_FONTS, AVAILABLE_FONT_SIZES, PASTEL_COLORS } from "../../constants/app";

interface EditorToolbarProps {
  editor: Editor | null;
  isDark: boolean;
}

export function EditorToolbar({ editor, isDark }: EditorToolbarProps) {
  // Dropdown states
  const [headingOpen, setHeadingOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [fontFamilyOpen, setFontFamilyOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);

  if (!editor) return null;

  return (
    <div className="flex justify-center py-3 relative z-50">
      <div
        className={`flex items-center gap-0.5 px-2 py-1 backdrop-blur-sm rounded-lg border ${
          isDark
            ? "bg-neutral-800/80 border-neutral-700/50"
            : "bg-white/80 border-neutral-200 shadow-sm"
        }`}
      >
        {/* Undo / Redo */}
        <button
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className={`p-2 rounded transition-colors disabled:opacity-30 ${
            isDark
              ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
              : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
          }`}
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className={`p-2 rounded transition-colors disabled:opacity-30 ${
            isDark
              ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
              : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
          }`}
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="w-px h-4 bg-neutral-700 mx-1" />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setFontFamilyOpen(!fontFamilyOpen);
              setFontSizeOpen(false);
              setHeadingOpen(false);
              setListOpen(false);
            }}
            className={`p-2 rounded transition-colors flex items-center gap-1 ${
              isDark
                ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            }`}
            title="Font Family"
          >
            <Type size={16} />
            <ChevronDown size={12} />
          </button>
          {fontFamilyOpen && (
            <div
              className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-60 min-w-[140px] ${
                isDark
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-neutral-200"
              }`}
            >
              {AVAILABLE_FONTS.map((font) => (
                <button
                  key={font.name}
                  className={`w-full text-left px-3 py-1.5 text-sm ${
                    isDark
                      ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                  onClick={() => {
                    editor?.chain().focus().setFontFamily(font.family).run();
                    setFontFamilyOpen(false);
                  }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setFontSizeOpen(!fontSizeOpen);
              setFontFamilyOpen(false);
              setHeadingOpen(false);
              setListOpen(false);
            }}
            className={`p-2 rounded transition-colors flex items-center gap-1 ${
              isDark
                ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            }`}
            title="Font Size"
          >
            <ALargeSmall size={16} />
            <ChevronDown size={12} />
          </button>
          {fontSizeOpen && (
            <div
              className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-60 min-w-[80px] ${
                isDark
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-neutral-200"
              }`}
            >
              {AVAILABLE_FONT_SIZES.map((size) => (
                <button
                  key={size}
                  className={`w-full text-left px-3 py-1.5 text-sm ${
                    isDark
                      ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                  onClick={() => {
                    editor
                      ?.chain()
                      .focus()
                      .setMark("textStyle", { fontSize: `${size}px` })
                      .run();
                    setFontSizeOpen(false);
                  }}
                >
                  {size}px
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-neutral-700 mx-1" />

        {/* Structure */}
        {/* Heading Dropdown */}
        <div className="relative">
          <button
            className="p-2 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5"
            title="Heading"
            onClick={() => {
              setHeadingOpen(!headingOpen);
              setListOpen(false);
            }}
          >
            <Heading1 size={16} />
            <ChevronDown size={12} />
          </button>
          {headingOpen && (
            <div
              className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[120px] ${
                isDark
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-neutral-200"
              }`}
            >
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${
                  editor?.isActive("heading", { level: 1 })
                    ? "text-[#F25C54]"
                    : ""
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 1 }).run();
                  setHeadingOpen(false);
                }}
              >
                <Heading1 size={16} /> Heading 1
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${
                  editor?.isActive("heading", { level: 2 })
                    ? "text-[#F25C54]"
                    : ""
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 2 }).run();
                  setHeadingOpen(false);
                }}
              >
                <Heading2 size={16} /> Heading 2
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${
                  editor?.isActive("heading", { level: 3 })
                    ? "text-[#F25C54]"
                    : ""
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 3 }).run();
                  setHeadingOpen(false);
                }}
              >
                <Heading3 size={16} /> Heading 3
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${
                  editor?.isActive("heading", { level: 4 })
                    ? "text-[#F25C54]"
                    : ""
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 4 }).run();
                  setHeadingOpen(false);
                }}
              >
                <Heading4 size={16} /> Heading 4
              </button>
            </div>
          )}
        </div>

        {/* List Dropdown */}
        <div className="relative">
          <button
            className="p-2 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5"
            title="List"
            onClick={() => {
              setListOpen(!listOpen);
              setHeadingOpen(false);
            }}
          >
            <List size={16} />
            <ChevronDown size={12} />
          </button>
          {listOpen && (
            <div
              className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[120px] ${
                isDark
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-neutral-200"
              }`}
            >
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${editor?.isActive("bulletList") ? "text-[#F25C54]" : ""}`}
                onClick={() => {
                  editor?.chain().focus().toggleBulletList().run();
                  setListOpen(false);
                }}
              >
                <List size={16} /> Bullet
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${editor?.isActive("orderedList") ? "text-[#F25C54]" : ""}`}
                onClick={() => {
                  editor?.chain().focus().toggleOrderedList().run();
                  setListOpen(false);
                }}
              >
                <ListOrdered size={16} /> Ordered
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm ${
                  isDark
                    ? "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                } ${editor?.isActive("taskList") ? "text-[#F25C54]" : ""}`}
                onClick={() => {
                  editor?.chain().focus().toggleTaskList().run();
                  setListOpen(false);
                }}
              >
                <ListChecks size={16} /> Task
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("blockquote")
              ? "bg-[#F25C54]/20 text-[#F25C54]"
              : isDark
              ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          }`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("codeBlock")
              ? "bg-[#F25C54]/20 text-[#F25C54]"
              : isDark
              ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          }`}
          title="Code"
        >
          <Code size={16} />
        </button>

        <div
          className={`w-px h-4 mx-1 ${
            isDark ? "bg-neutral-700" : "bg-neutral-200"
          }`}
        />

        {/* Highlight Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setHighlightOpen(!highlightOpen);
              setTextColorOpen(false); // Close others
              setHeadingOpen(false);
              setListOpen(false);
            }}
            className={`p-2 rounded transition-colors flex items-center gap-0.5 ${
              editor.isActive("highlight")
                ? "bg-[#F25C54]/20 text-[#F25C54]"
                : isDark
                ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
                : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
            }`}
            title="Highlight Color"
          >
            <Highlighter size={16} />
            <ChevronDown size={12} />
          </button>

          {highlightOpen && (
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl z-50 flex gap-1.5 ${
                isDark
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-neutral-200"
              }`}
            >
              {/* Unset Button */}
              <button
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHighlightOpen(false);
                }}
                className={`w-6 h-6 rounded border flex items-center justify-center transition-transform hover:scale-110 ${
                  isDark
                    ? "border-neutral-600 bg-neutral-700"
                    : "border-gray-200 bg-gray-50"
                }`}
                title="Remove Highlight"
              >
                <div
                  className={`w-0.5 h-full rotate-45 ${
                    isDark ? "bg-red-400" : "bg-red-500"
                  }`}
                />
              </button>

              <div className="w-px h-6 bg-neutral-700/20 mx-0.5" />

              {PASTEL_COLORS.map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setHighlight({ color: swatch.color })
                      .setColor("#000000") // Force black text
                      .run();
                    setHighlightOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text Color Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setTextColorOpen(!textColorOpen);
              setHighlightOpen(false);
              setHeadingOpen(false);
              setListOpen(false);
            }}
            className={`p-2 rounded transition-colors flex items-center gap-0.5 ${
              editor.getAttributes("textStyle").color
                ? "text-[#F25C54]"
                : isDark
                ? "hover:bg-neutral-700 text-neutral-400 hover:text-white"
                : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
            }`}
            title="Text Color"
          >
            <Palette size={16} />
            <ChevronDown size={12} />
          </button>

          {textColorOpen && (
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl z-50 flex gap-1.5 ${
                isDark
                  ? "bg-neutral-800 border border-neutral-700"
                  : "bg-white border border-neutral-200"
              }`}
            >
              {/* Unset Button */}
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setTextColorOpen(false);
                }}
                className={`w-6 h-6 rounded border flex items-center justify-center transition-transform hover:scale-110 ${
                  isDark
                    ? "border-neutral-600 bg-neutral-700"
                    : "border-gray-200 bg-gray-50"
                }`}
                title="Default Color"
              >
                <span className="text-xs font-bold">A</span>
              </button>

              <div className="w-px h-6 bg-neutral-700/20 mx-0.5" />

              {PASTEL_COLORS.map((swatch) => (
                <button
                  key={swatch.color}
                  onClick={() => {
                    editor.chain().focus().setColor(swatch.color).run();
                    setTextColorOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110"
                  style={{ backgroundColor: swatch.color }}
                  title={swatch.name}
                />
              ))}

              <div className="w-px h-6 bg-neutral-700/20 mx-0.5" />

              {/* Custom Color Input */}
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/10 transition-transform hover:scale-110 bg-linear-to-br from-pink-400 via-purple-400 to-indigo-400">
                <input
                  type="color"
                  onInput={(e) => {
                    editor
                      .chain()
                      .focus()
                      .setColor((e.target as HTMLInputElement).value)
                      .run();
                    // setTextColorOpen(false); // REMOVED: Keep open while picking
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Custom Color"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-neutral-700 mx-1" />

        {/* Text Formatting */}
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("bold")
              ? "bg-[#F25C54]/20 text-[#F25C54]"
              : isDark
              ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("italic")
              ? "bg-[#F25C54]/20 text-[#F25C54]"
              : isDark
              ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("strike")
              ? "bg-[#F25C54]/20 text-[#F25C54]"
              : isDark
              ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("underline")
              ? "bg-[#F25C54]/20 text-[#F25C54]"
              : isDark
              ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          }`}
          title="Underline"
        >
          <Underline size={16} />
        </button>
      </div>
    </div>
  );
}
