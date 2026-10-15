import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extensions } from "@tiptap/core";

/** The same pieces the app's editor is built from (the app has more, like images and fonts). No links: pasted
 *  addresses stay plain text in a demo, so nothing in the notebook can navigate away from the page. */
export function notebookExtensions(): Extensions {
  return [
    StarterKit.configure({ link: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight,
    TextStyle,
    Color,
    Placeholder.configure({ placeholder: "Write something..." }),
  ];
}
