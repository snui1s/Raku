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
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

  // Draggable State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem("raku-toolbar-position");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Visible State
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem("raku-toolbar-visible");
    return saved !== null ? saved === "true" : true;
  });

  const toolbarRef = useRef<HTMLDivElement>(null);

  const closeAllDropdowns = () => {
    setHeadingOpen(false);
    setListOpen(false);
    setHighlightOpen(false);
    setTextColorOpen(false);
    setFontFamilyOpen(false);
    setFontSizeOpen(false);
  };

  useEffect(() => {
    localStorage.setItem("raku-toolbar-visible", String(isVisible));
  }, [isVisible]);

  useEffect(() => {
    if (position) {
      localStorage.setItem("raku-toolbar-position", JSON.stringify(position));
    } else {
      localStorage.removeItem("raku-toolbar-position");
    }
  }, [position]);

  // Keyboard shortcut Ctrl+Shift+T / Cmd+Shift+T to toggle toolbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    closeAllDropdowns();

    const rect = toolbarRef.current?.getBoundingClientRect();
    const initialX = rect ? rect.left : (window.innerWidth - 600) / 2;
    const initialY = rect ? rect.top : 60;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;

      let newX = dragStartRef.current.initialX + dx;
      let newY = dragStartRef.current.initialY + dy;

      // Clamp inside window boundaries
      const toolbarWidth = toolbarRef.current?.offsetWidth || 500;
      const toolbarHeight = toolbarRef.current?.offsetHeight || 50;

      newX = Math.max(10, Math.min(window.innerWidth - toolbarWidth - 10, newX));
      newY = Math.max(10, Math.min(window.innerHeight - toolbarHeight - 10, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const resetPosition = () => {
    setPosition(null);
    localStorage.removeItem("raku-toolbar-position");
  };

  if (!editor) return null;

  if (!isVisible) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsVisible(true)}
          className="px-3 py-1.5 rounded-full backdrop-blur-md bg-app-toolbar border border-app-border text-xs text-app-muted hover:text-accent shadow-md transition-all flex items-center gap-1.5 group cursor-pointer hover:scale-105"
          title="Show Toolbar (Ctrl+Shift+T)"
        >
          <Eye size={14} className="text-accent" />
          <span className="font-medium">Show Toolbar</span>
          <span className="text-[10px] opacity-60 font-mono bg-app-tertiary px-1.5 py-0.5 rounded">Ctrl+Shift+T</span>
        </button>
      </div>
    );
  }

  const toolbarStyle: React.CSSProperties = position
    ? {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 40,
        margin: 0,
      }
    : {};

  return (
    <div
      className={`flex justify-center py-3 relative z-20 ${
        isDragging ? "select-none" : ""
      }`}
      style={toolbarStyle}
    >
      <div
        ref={toolbarRef}
        className="flex items-center gap-0.5 px-2 py-1 backdrop-blur-md rounded-lg border border-app-border bg-app-toolbar shadow-md transition-colors duration-200"
      >
        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={resetPosition}
          className="cursor-grab active:cursor-grabbing p-1.5 text-app-muted hover:text-accent rounded transition-colors"
          title="Drag to move toolbar (Double-click to reset position)"
        >
          <GripVertical size={16} />
        </div>

        <div className="w-px h-4 border-app-border mx-0.5 border-r" />
        {/* Undo / Redo */}
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().undo().run();
          }}
          disabled={!editor?.can().undo()}
          className="p-2 rounded transition-colors disabled:opacity-30 text-app-muted hover:bg-app-tertiary hover:text-app-text"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().redo().run();
          }}
          disabled={!editor?.can().redo()}
          className="p-2 rounded transition-colors disabled:opacity-30 text-app-muted hover:bg-app-tertiary hover:text-app-text"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="w-px h-4 border-app-border mx-1 border-r" />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              const next = !fontFamilyOpen;
              closeAllDropdowns();
              setFontFamilyOpen(next);
            }}
            className="p-2 rounded transition-colors flex items-center gap-1 text-app-muted hover:bg-app-tertiary hover:text-app-text"
            title="Font Family"
          >
            <Type size={16} />
            <ChevronDown size={12} />
          </button>
          {fontFamilyOpen && (
            <div
              className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[180px] max-h-72 overflow-y-auto bg-app-dropdown border-app-border text-app-text border"
            >
              {AVAILABLE_FONTS.map((font) => {
                const isActive = editor?.getAttributes("textStyle").fontFamily === font.family;
                return (
                  <button
                    key={font.name}
                    style={{ fontFamily: font.family }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center justify-between ${
                      isActive
                        ? "text-accent font-semibold bg-app-tertiary"
                        : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                    }`}
                    onClick={() => {
                      editor?.chain().focus().setFontFamily(font.family).run();
                      closeAllDropdowns();
                    }}
                  >
                    <span>{font.name}</span>
                    {isActive && <span className="text-xs text-accent">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              const next = !fontSizeOpen;
              closeAllDropdowns();
              setFontSizeOpen(next);
            }}
            className="p-2 rounded transition-colors flex items-center gap-1 text-app-muted hover:bg-app-tertiary hover:text-app-text"
            title="Font Size"
          >
            <ALargeSmall size={16} />
            <ChevronDown size={12} />
          </button>
          {fontSizeOpen && (
            <div
              className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[100px] bg-app-dropdown border-app-border text-app-text border"
            >
              {AVAILABLE_FONT_SIZES.map((size) => {
                const currentSizeStr = editor?.getAttributes("textStyle").fontSize;
                const currentSizeNum = currentSizeStr ? parseInt(currentSizeStr, 10) : 16;
                const isActive = currentSizeNum === size;
                return (
                  <button
                    key={size}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center justify-between ${
                      isActive
                        ? "text-accent font-semibold bg-app-tertiary"
                        : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                    }`}
                    onClick={() => {
                      editor
                        ?.chain()
                        .focus()
                        .setMark("textStyle", { fontSize: `${size}px` })
                        .run();
                      closeAllDropdowns();
                    }}
                  >
                    <span>{size}px</span>
                    {isActive && <span className="text-xs text-accent">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-4 border-app-border mx-1 border-r" />

        {/* Structure */}
        {/* Heading Dropdown */}
        <div className="relative">
          <button
            className="p-2 rounded hover:bg-app-tertiary text-app-muted hover:text-app-text transition-colors flex items-center gap-0.5"
            title="Heading"
            onClick={() => {
              const next = !headingOpen;
              closeAllDropdowns();
              setHeadingOpen(next);
            }}
          >
            <Heading1 size={16} />
            <ChevronDown size={12} />
          </button>
          {headingOpen && (
            <div
              className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[120px] bg-app-dropdown border-app-border text-app-text border"
            >
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("heading", { level: 1 })
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 1 }).run();
                  closeAllDropdowns();
                }}
              >
                <Heading1 size={16} /> Heading 1
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("heading", { level: 2 })
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 2 }).run();
                  closeAllDropdowns();
                }}
              >
                <Heading2 size={16} /> Heading 2
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("heading", { level: 3 })
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 3 }).run();
                  closeAllDropdowns();
                }}
              >
                <Heading3 size={16} /> Heading 3
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("heading", { level: 4 })
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleHeading({ level: 4 }).run();
                  closeAllDropdowns();
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
            className="p-2 rounded hover:bg-app-tertiary text-app-muted hover:text-app-text transition-colors flex items-center gap-0.5"
            title="List"
            onClick={() => {
              const next = !listOpen;
              closeAllDropdowns();
              setListOpen(next);
            }}
          >
            <List size={16} />
            <ChevronDown size={12} />
          </button>
          {listOpen && (
            <div
              className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[120px] bg-app-dropdown border-app-border text-app-text border"
            >
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("bulletList")
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleBulletList().run();
                  closeAllDropdowns();
                }}
              >
                <List size={16} /> Bullet
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("orderedList")
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleOrderedList().run();
                  closeAllDropdowns();
                }}
              >
                <ListOrdered size={16} /> Ordered
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  editor?.isActive("taskList")
                    ? "text-accent font-semibold bg-app-tertiary"
                    : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
                }`}
                onClick={() => {
                  editor?.chain().focus().toggleTaskList().run();
                  closeAllDropdowns();
                }}
              >
                <ListChecks size={16} /> Task
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().toggleBlockquote().run();
          }}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("blockquote")
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
          }`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().toggleCodeBlock().run();
          }}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("codeBlock")
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
          }`}
          title="Code"
        >
          <Code size={16} />
        </button>

        <div className="w-px h-4 border-app-border mx-1 border-r" />

        {/* Highlight Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              const next = !highlightOpen;
              closeAllDropdowns();
              setHighlightOpen(next);
            }}
            className={`p-2 rounded transition-colors flex items-center gap-0.5 ${
              editor.isActive("highlight")
                ? "bg-accent-muted text-accent font-semibold"
                : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
            }`}
            title="Highlight Color"
          >
            <Highlighter size={16} />
            <ChevronDown size={12} />
          </button>

          {highlightOpen && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl z-50 flex gap-1.5 bg-app-dropdown border-app-border text-app-text border"
            >
              {/* Unset Button */}
              <button
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  closeAllDropdowns();
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
                    closeAllDropdowns();
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
              const next = !textColorOpen;
              closeAllDropdowns();
              setTextColorOpen(next);
            }}
            className={`p-2 rounded transition-colors flex items-center gap-0.5 ${
              editor.getAttributes("textStyle").color
                ? "text-accent font-semibold"
                : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
            }`}
            title="Text Color"
          >
            <Palette size={16} />
            <ChevronDown size={12} />
          </button>

          {textColorOpen && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg shadow-xl z-50 flex gap-1.5 bg-app-dropdown border-app-border text-app-text border"
            >
              {/* Unset Button */}
              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  closeAllDropdowns();
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
                    closeAllDropdowns();
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
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Custom Color"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-4 border-app-border mx-1 border-r" />

        {/* Text Formatting */}
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().toggleBold().run();
          }}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("bold")
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().toggleItalic().run();
          }}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("italic")
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().toggleStrike().run();
          }}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("strike")
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          onClick={() => {
            closeAllDropdowns();
            editor?.chain().focus().toggleUnderline().run();
          }}
          className={`p-2 rounded transition-colors ${
            editor?.isActive("underline")
              ? "bg-accent-muted text-accent font-semibold"
              : "text-app-muted hover:bg-app-tertiary hover:text-app-text"
          }`}
          title="Underline"
        >
          <Underline size={16} />
        </button>

        <div className="w-px h-4 border-app-border mx-0.5 border-r" />

        {/* Reset Position Button (shown if dragged) */}
        {position !== null && (
          <button
            onClick={resetPosition}
            className="p-1.5 rounded transition-colors text-app-muted hover:text-accent hover:bg-app-tertiary"
            title="Reset Position"
          >
            <RotateCcw size={14} />
          </button>
        )}

        {/* Hide Toolbar Button */}
        <button
          onClick={() => {
            closeAllDropdowns();
            setIsVisible(false);
          }}
          className="p-1.5 rounded transition-colors text-app-muted hover:text-accent hover:bg-app-tertiary"
          title="Hide Toolbar (Ctrl+Shift+T)"
        >
          <EyeOff size={16} />
        </button>
      </div>
    </div>
  );
}

