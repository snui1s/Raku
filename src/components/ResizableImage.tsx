import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useState, useRef } from "react";

export const ResizableImage = (props: NodeViewProps) => {
  const [width, setWidth] = useState(props.node.attrs.width || "auto");
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Update state if node attributes change externally (e.g. undo/redo)
  useEffect(() => {
    setWidth(props.node.attrs.width || "auto");
  }, [props.node.attrs.width]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = imageRef.current?.offsetWidth || 0;

      const onMouseMove = (e: MouseEvent) => {
        const currentX = e.clientX;
        const diffX = currentX - startX;
        const newWidth = Math.max(100, startWidth + diffX); // Min width 100px
        setWidth(`${newWidth}px`);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        // Commit change to Tiptap (important for history/save)
        if (imageRef.current) {
          props.updateAttributes({
            width: `${imageRef.current.offsetWidth}px`,
            // height: "auto" // Maintain aspect ratio automatically
          });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [props] // Depend on props to ensure updateAttributes is fresh
  );

  const isSelected = props.selected;

  return (
    <NodeViewWrapper className="resize-image-wrapper inline-block relative leading-none">
      <div
        className={`relative inline-block transition-all ${
          isSelected || isResizing ? "ring-2 ring-[#F25C54]" : ""
        }`}
        style={{ width: width === "auto" ? "auto" : width }}
      >
        {/* The Image */}
        <img
          ref={imageRef}
          src={props.node.attrs.src}
          alt={props.node.attrs.alt}
          className={`block max-w-full h-auto rounded-lg shadow-sm ${
            isResizing ? "pointer-events-none select-none opacity-90" : "" // Prevent native drag during resize
          }`}
          style={{ width: "100%", height: "auto" }}
        />

        {/* Resize Handle (Bottom Right) */}
        {(isSelected || isResizing) && (
          <div
            className="absolute bottom-1 right-1 w-4 h-4 bg-[#F25C54] border-2 border-white rounded-full cursor-nwse-resize z-10 hover:scale-125 transition-transform"
            onMouseDown={onMouseDown}
            title="Drag to resize"
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
