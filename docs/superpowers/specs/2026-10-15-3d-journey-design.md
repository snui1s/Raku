# The whole home page as one 3D journey: design

Date: 2026-10-15. Status: draft for the owner's review. Builds on `2026-10-14-website-design.md` (the site) and the
constellation work already on `feat/website`.

## Goal

The home page is one continuous 3D scene that the visitor scrolls through, from the hero to the download, instead of a
3D hero followed by flat dark sections. It includes a notebook the visitor can actually write in.

What the owner said (and what is assumed):

- One world for the whole page, not separate small scenes. (said)
- A try-it notebook that really works, floating in the scene. No short challenges or tasks. (said)
- The download is a sign hanging from the fox's neck, reached by moving the camera over to the fox. (said)
- Phones, reduced motion and no-WebGL keep a plain, working page. (assumed: same rule as the existing site)
- Docs and privacy pages stay as they are. (assumed)

## The journey

One tall section holds a pinned frame (the same technique as today's hero). Scrolling moves a timeline; the canvas
never leaves the screen until the footer. All words, buttons and the notebook are real DOM placed over the canvas by
projecting 3D anchor points to screen positions every frame (what the feature labels do now). No text is drawn in WebGL.

| Chapter | Camera and scene | DOM over the scene |
|---|---|---|
| 1 Hero | Today's hero camera, exactly | Title, tagline, Download and Docs buttons |
| 2 Stars | Tilts up into the sky (today's constellation) | Five feature labels, minor features line |
| 3 Write | Tilts back down to the glade by the cherry tree, then holds | The notebook, floating in front of the tree |
| 4 Numbers | Pans over to the cherry tree | The four numbers under paper lanterns tied to its branches (3D anchor points) |
| 5 Download | Moves in low and close to the fox | A wooden tag on the fox's chest with the Download link on it |

Scroll lengths are in screen heights, starting values to be tuned by eye: hero hold 0.2, tilt 0.9, five features 0.6
each, descent 0.9, write hold 1.6, numbers 0.8, move to the fox 0.9, final hold 0.6 (about 9.5 screens in all).

### Timeline module

`journey.ts` replaces the scroll logic in `constellation.ts`. A pure function `journeyAt(scrollVh)` returns
`{ chapter, progress, camera: {position, target, fov}, skyBlend, feature }`. The constellation maths (star positions,
labels, line reveal) stays and becomes chapter 2. Constraints, each with a test:

- At scroll 0 the camera, target and fov equal today's `CAMERA` exactly (the stills are rendered from it).
- The camera path is continuous: no jump between chapters. Never rolled (up vector stays +y).
- Total scroll height equals the sum of the chapter lengths.
- Chapter boundaries are monotonic and every chapter has a positive length.

### The fox's tag

- A small wooden tag (an *ema*, like the prayer tablets at shrines) on a cord around the fox's neck, hanging on the
  chest. Built in `fox.ts` as part of the fox, with a gentle sway driven by `windGust`. It is a real mesh so it takes
  the moon's light and shadow like the rest.
- The Download link is a real `<a data-download>` positioned over the tag, sized to match it on screen. It keeps the
  release lookup and the fallback link already in `release.ts`. `check-build.ts` still requires the link.
- The fox's neck position in world space (fox group transform applied to the neck point) is the anchor for the DOM link
  and for the camera target in chapter 5.

### The notebook

- A page-like card, styled to look like the app (paper, the same fonts and colors), over the glade. Pointer events on.
- Built with TipTap without React (`@tiptap/core` + the same extensions as the app: StarterKit, Underline, TaskList,
  TaskItem, Highlight, TextStyle, Color, Placeholder) and a small toolbar (headings, bold, italic, lists, checklist,
  highlight). It opens with a short sample note the visitor can erase or write over.
- Loaded with a dynamic import when the journey gets near chapter 3, so the first load does not grow.
- Nothing is saved or sent anywhere. Closing or reloading the page loses the text. This matches "local first".
- Typing, including IME input (Thai), must work. The notebook has a fixed maximum height and scrolls inside itself.
- While the notebook has focus, the scene keeps its position (the camera is driven by scroll, not by typing) and the
  keys the page uses for scrolling (space, arrows) stay with the editor.
- Without the live scene it is the same card in the normal page flow.

## Without the live scene

Phones, reduced motion and no WebGL get today's fallback: the still picture, then ordinary sections in order: features
list, the notebook (a plain card), numbers, and a Download section with a plain button. The notebook works on phones.
The Screenshots section is removed (the notebook replaces it).

## Keyboard and focus

Every interactive piece is real DOM in reading order: Download and Docs, the feature labels, the notebook, the final
Download link. If focus moves into a chapter the scroll is not at (Tab, or the "Features" nav link), the page scrolls
to that chapter's position first so the camera and the thing focused agree. The nav "Features" link goes to the start
of chapter 2.

## Performance

- Still one renderer and one scene, as today. Added: a tag mesh and a few small meshes for the number signs, so draw
  calls stay near the current ~66. The notebook and signs are DOM, not GPU work.
- No CSS `backdrop-filter` blur over the canvas (it costs GPU every frame).
- The existing pause when the tab is hidden, the adaptive resolution and the `?fps` readout stay.
- The notebook code loads only when needed. Budget: home page without the 3D and editor chunks stays about as today.

## Out of scope

3D on docs or privacy pages, sound, saving or exporting notes from the demo, tasks or challenges in the notebook,
3D on phones, replacing the three still sizes with new ones beyond re-rendering the existing set.

## Testing

- Unit: `journeyAt` (the constraints above); the anchor projection for the tag; the notebook's extension list and its
  sample document; scroll-to-chapter for a focus target.
- Build: `astro check`, `astro build`, `check-build.ts` (Download link present, scene host present, SmartScreen note).
- Visual (headless Chrome, as before): screenshots at each chapter on desktop, the phone and reduced-motion pages, and
  the "Features" link landing. Typing into the notebook in the headless browser and reading back the text.
- Not verifiable by me: smoothness on a real GPU (the owner checks with `?fps`) and a real IME. Both are called out in
  the hand-off, not claimed.

## Risks

- A page this long (about 9.5 screens) can feel slow to scroll; the chapter lengths are the knobs.
- Camera positions for chapters 3 to 5 need tuning against the real geometry (tree, gate, fox, hill); expect a few
  rounds of screenshots.
- The tag must stay readable and clickable as the camera moves in; if the fox's pose makes the chest hard to see from
  the chapter 5 camera, the fox can turn slightly toward the camera in that chapter.
