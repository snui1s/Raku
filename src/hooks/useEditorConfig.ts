import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImage } from "../components/ResizableImage";
import UnderlineExtension from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { saveImage } from "../utils/imageUtils";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import { Extension } from "@tiptap/core";
import Dropcursor from "@tiptap/extension-dropcursor";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";

export function useEditorConfig() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      ListItem,
      Dropcursor.configure({
        color: "#F25C54", // Accent color
        width: 2,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            fontSize: {
              default: null,
              parseHTML: (element) =>
                element.style.fontSize?.replace(/['"]+/g, ""),
              renderHTML: (attributes) => {
                if (!attributes.fontSize) {
                  return {};
                }
                return { style: `font-size: ${attributes.fontSize}` };
              },
            },
          };
        },
      }),
      FontFamily,
      Color,
      // Custom Behavior Extension
      Extension.create({
        name: "customBehavior",
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": ({ editor }) => {
              const pos = editor.state.selection.$from.after();
              return editor
                .chain()
                .insertContentAt(pos, { type: "paragraph" })
                .focus(pos + 1)
                .run();
            },
            Enter: ({ editor }) => {
              // 1. Enter in Highlight Mode -> Split and Remove Highlight
              if (editor.isActive("highlight")) {
                return editor.chain().splitBlock().unsetHighlight().run();
              }

              // 2. Double Enter to Reset Color
              // If we are on an empty line (content size 0) and have a custom color
              const { empty, $anchor } = editor.state.selection;
              const isNodeEmpty = $anchor.parent.content.size === 0;
              const hasColor = editor.getAttributes("textStyle").color;

              if (empty && isNodeEmpty && hasColor) {
                return editor.chain().unsetColor().run();
              }

              return false; // Let other extensions handle Enter (like Lists)
            },
          };
        },
      }),
      BulletList.extend({
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { empty, $anchor } = this.editor.state.selection;
              const isAtStart = $anchor.pos === $anchor.start();
              if (!empty || !isAtStart) return false;
              if (this.editor.isActive("bulletList")) {
                const parent = $anchor.parent;
                if (parent.content.size === 0) {
                  return this.editor
                    .chain()
                    .focus()
                    .liftListItem("listItem")
                    .run();
                }
              }
              return false;
            },
            Enter: ({ editor }) => editor.commands.splitListItem("listItem"),
          };
        },
      }),
      OrderedList.extend({
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { empty, $anchor } = this.editor.state.selection;
              const isAtStart = $anchor.pos === $anchor.start();
              if (!empty || !isAtStart) return false;
              if (this.editor.isActive("orderedList")) {
                const parent = $anchor.parent;
                if (parent.content.size === 0) {
                  return this.editor
                    .chain()
                    .focus()
                    .liftListItem("listItem")
                    .run();
                }
              }
              return false;
            },
            Enter: ({ editor }) => editor.commands.splitListItem("listItem"),
          };
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      UnderlineExtension,
      TaskList,
      TaskItem.extend({
        addInputRules() {
          return [];
        },
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { empty, $anchor } = this.editor.state.selection;
              const isAtStart = $anchor.pos === $anchor.start();

              if (!empty || !isAtStart) return false;

              if (this.editor.isActive("taskItem")) {
                const parent = $anchor.parent;
                // If the item (paragraph inside taskItem) is empty
                if (parent.content.size === 0) {
                  return this.editor
                    .chain()
                    .focus()
                    .liftListItem("taskItem")
                    .run();
                }
              }
              return false;
            },
            Enter: ({ editor }) => {
              // Explicitly ensure Enter splits the list item
              return editor.commands.splitListItem("taskItem");
            },
          };
        },
      }).configure({
        nested: true,
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
            },
            height: {
              default: null,
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImage);
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        spellCheck: "false",
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none prose-neutral dark:prose-invert`,
      },

      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const item = items.find((item) => item.type.startsWith("image"));

        if (item) {
          event.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            saveImage(blob)
              .then((url) => {
                const imageNode = view.state.schema.nodes.image.create({
                  src: url,
                });
                const transaction =
                  view.state.tr.replaceSelectionWith(imageNode);
                view.dispatch(transaction);
              })
              .catch((err) => {
                console.error("Failed to save image:", err);
                alert(
                  "Failed to save image. Make sure you are running with 'bun tauri dev' to enable file system access."
                );
              });
          }
          return true;
        }
        return false;
      },
      handleDrop: (view, event, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files.length > 0
        ) {
          const files = Array.from(event.dataTransfer.files);
          const imageFile = files.find((file) => file.type.startsWith("image"));

          if (imageFile) {
            event.preventDefault();

            // Get coordinates for the drop
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            saveImage(imageFile)
              .then((url) => {
                const imageNode = view.state.schema.nodes.image.create({
                  src: url,
                });

                const transaction = view.state.tr.insert(
                  coordinates?.pos ?? view.state.selection.anchor,
                  imageNode
                );
                view.dispatch(transaction);
              })
              .catch((err) => {
                console.error("Failed to save image:", err);
              });
            return true;
          }
        }
        return false;
      },
    },
    autofocus: true,
  });

  return editor;
}
