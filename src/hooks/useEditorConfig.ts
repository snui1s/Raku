import { useEditor } from "@tiptap/react";
import { createEditorExtensions } from "../utils/editorExtensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImage } from "../components/ResizableImage";
import { saveImage } from "../utils/imageUtils";

export function useEditorConfig() {
  const editor = useEditor({
    extensions: createEditorExtensions(ReactNodeViewRenderer(ResizableImage)),
    content: "",
    editorProps: {
      attributes: {
        spellCheck: "false",
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none min-h-[55vh] focus:outline-none prose-neutral dark:prose-invert`,
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
