const task = (text: string, checked: boolean) =>
  `<li data-checked="${checked}" data-type="taskItem"><label><input type="checkbox" aria-label="Done"${checked ? ' checked="checked"' : ""}><span></span></label><div><p>${text}</p></div></li>`;

/** The note the notebook opens with. The page renders it before the editor loads, and the editor starts from it. */
export const SAMPLE_HTML = [
  "<h1>A quiet night</h1>",
  "<p>This is a real editor. Click anywhere and write. Nothing you write leaves this page.</p>",
  "<h2>For tonight</h2>",
  `<ul data-type="taskList">${task("Water the sakura", true)}${task("Pour some tea", false)}${task("Write something here", false)}</ul>`,
].join("");
