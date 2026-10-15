# Codebase Symbol Index

## .github/scripts/bump-version.mjs
- const `[arg, flag]` @6
- const `dry` @7
- const `read()` @8 (calls: `fs.readFileSync`)
- const `write()` @9 (calls: `fs.writeFileSync`)
- const `pkgPath` @11
- const `pkg` @12
- export function `nextVersion()` @14 (calls: `test`, `current.match`, `map`, `m.slice`; raises: `Error`)
- const `version` @26
- const `pkgRaw` @29
- const `confPath` @33
- const `confRaw` @34
- const `tomlPath` @38
- const `tomlRaw` @39
- const `lockPath` @43

## .github/scripts/gen-update-json.mjs
- const `[version, exePath, repo, notes]` @6
- const `sigPath` @12
- const `update` @18

## bench/data.ts
- const `words` @4
- const `sentence()` @9 (calls: `join`, `Array.from`)
- export interface `BenchNote` @12
- export function `makeContent()` @22 (calls: `text`, `sentence`, `para`, `map`, `nodes.push`, `JSON.stringify`)
- export function `makeNotes()` @43 (calls: `Date.now`, `Array.from`, `sentence`, `makeContent`, `randomUUID`)

## bench/run.ts
- interface `Row` @9
- const `rows` @16
- function `measure()` @19 (calls: `fn`, `performance.now`, `times.push`, `times.sort`, `rows.push`, `Math.floor`)
- function `sqliteWith()` @38 (calls: `DatabaseSync`, `db.exec`, `db.prepare`, `insert.run`)
- const `cpu` @108

## release.js
- let `privateKey` @7
- let `privateKeyPassword` @8
- const `packageJson` @31
- const `version` @32
- const `tauriConfPath` @36
- const `tauriConf` @37
- const `sigPath` @72
- const `signature` @86
- const `updateData` @90

## src/App.tsx
- function `App()` @22 (calls: `useState`, `localStorage.getItem`, `useEffect`, `e.key.toLowerCase`, `e.preventDefault`, `setZenMode`, `window.addEventListener`, `window.removeEventListener`, `document.documentElement.classList.add`, `document.documentElement.classList.remove`, `document.documentElement.setAttribute`, `localStorage.setItem`, `useAppUpdate`, `useEditorConfig`, `useNotes`, `useSettings`, `useRef`, `useCallback`, `setZoomHint`, `window.clearTimeout`, `window.setTimeout`, `showZoomHint`, `Math.trunc`, `zoomBy`, `el.addEventListener`, `el.removeEventListener`, `editor?.view.dom.setAttribute`, `String`, `resetZoom`, `setPaletteOpen`, `folders.find`, `clearTimeout`, `JSON.stringify`, `editor.getJSON`, `updateNote`, `editor.on`, `editor.off`, `selectNote`, `JSON.parse`, `editor.commands.setContent`, `createNote`, `folderNameOf`, `run`, `focus`, `editor?.chain`, `toLocaleString`, `Date`, `createFolder`, `setIsDark`, `setIsExportOpen`)

## src/components/CommandPalette.tsx
- interface `CommandPaletteProps` @13
- interface `Item` @26
- export function `CommandPalette()` @34 (calls: `useState`, `useRef`, `useEffect`, `setQuery`, `setIndex`, `setTimeout`, `inputRef.current?.focus`, `useMemo`, `toLowerCase`, `query.trim`, `folders.find`, `map`, `slice`, `sort`, `notes
      .filter`, `includes`, `folderName`, `onSelectNote`, `filter`, `a.label.toLowerCase`, `Math.min`, `Math.max`, `onClose`, `item.run`, `e.preventDefault`, `runItem`, `items.map`)

## src/components/Editor/EditorToolbar.test.tsx
- let `editor` @8
- const `click()` @24 (calls: `fireEvent.click`, `screen.getByTitle`)

## src/components/Editor/EditorToolbar.tsx
- interface `EditorToolbarProps` @29
- export function `EditorToolbar()` @34 (calls: `useState`, `localStorage.getItem`, `useRef`, `useReducer`, `useEffect`, `editor.on`, `editor.off`, `setHeadingOpen`, `setListOpen`, `setHighlightOpen`, `setTextColorOpen`, `setFontFamilyOpen`, `setFontSizeOpen`, `localStorage.setItem`, `String`, `e.key.toLowerCase`, `e.preventDefault`, `setIsVisible`, `window.addEventListener`, `window.removeEventListener`, `toolbarRef.current.contains`, `closeAllDropdowns`, `document.addEventListener`, `document.removeEventListener`, `closest`, `run`, `undo`, `focus`, `editor?.chain`, `editor?.can`, `redo`, `AVAILABLE_FONTS.map`, `editor?.getAttributes`, `setFontFamily`, `AVAILABLE_FONT_SIZES.map`, `parseInt`, `setMark`, `editor
                        ?.chain`, `editor?.isActive`, `toggleHeading`, `toggleBulletList`, `toggleOrderedList`, `toggleTaskList`, `toggleBlockquote`, `toggleCodeBlock`, `editor.isActive`, `unsetHighlight`, `editor.chain`, `PASTEL_COLORS.map`, `setColor`, `setHighlight`, `editor
                      .chain`, `editor.getAttributes`, `unsetColor`, `toggleBold`, `toggleItalic`, `toggleStrike`, `toggleUnderline`)

## src/components/ErrorBoundary.tsx
- interface `State` @3
- export class `ErrorBoundary` @7
  - `getDerivedStateFromError()` @10
  - `componentDidCatch()` @14 (calls: `console.error`)
  - `render()` @18 (calls: `window.location.reload`)

## src/components/ExportMenu.tsx
- interface `ExportMenuProps` @17
- function `convertHtmlToMarkdown()` @25 (calls: `document.createElement`, `el.tagName.toLowerCase`, `join`, `map`, `Array.from`, `children.trim`, `el.parentElement?.tagName.toLowerCase`, `el.getAttribute`, `trim`)
- export function `ExportMenu()` @99 (calls: `useState`, `useRef`, `useEffect`, `rootRef.current.contains`, `setOpen`, `document.addEventListener`, `document.removeEventListener`, `setExportSuccess`, `setErrorMsg`, `trim`, `name.replace`, `URL.createObjectURL`, `document.createElement`, `document.body.appendChild`, `a.click`, `document.body.removeChild`, `URL.revokeObjectURL`, `blob.arrayBuffer`, `Uint8Array`, `writeFile`, `console.warn`, `triggerDownload`, `setIsExporting`, `editor.getHTML`, `convertHtmlToMarkdown`, `imgRegex.exec`, `images.push`, `Blob`, `sanitizeFilename`, `saveToDownloads`, `JSZip`, `zip.folder`, `src.startsWith`, `src.replace`, `pop`, `relativePath.split`, `readFile`, `console.error`, `src.match`, `atob`, `binaryStr.charCodeAt`, `imgFolder.file`, `updatedMarkdown.replace`, `zip.file`, `zip.generateAsync`, `alert`, `editor.getText`, `div.querySelectorAll`, `Array.from`, `img.getAttribute`, `btoa`, `join`, `map`, `String.fromCharCode`, `img.setAttribute`, `TextEncoder`, `str.replace`, `filter`, `textContent.split`, `l.trim`, `sanitize`, `line.match`, `encoder.encode`, `document.getElementById`, `iframe.remove`, `doc.open`, `doc.write`, `doc.close`, `createBackup`, `window.confirm`, `restoreBackup`, `setTimeout`, `window.location.reload`, `fileRef.current?.click`, `handleRestore`)

## src/components/Header.tsx
- interface `HeaderProps` @17
- const `iconBtn` @31
- export function `Header()` @34 (calls: `usePomodoro`, `useState`, `useRef`, `useEffect`, `themeMenuRef.current.contains`, `setThemeOpen`, `document.addEventListener`, `document.removeEventListener`, `THEMES.find`, `setSidebarOpen`, `crumbs.map`, `adjustMinutes`, `formatPomodoro`, `THEMES.map`, `setCurrentTheme`, `setIsDark`, `setZenMode`)

## src/components/ResizableImage.tsx
- export const `ResizableImage()` @5 (calls: `useState`, `useRef`, `useEffect`, `setWidth`, `src.startsWith`, `src.replace`, `catch`, `then`, `readFile`, `Blob`, `URL.createObjectURL`, `setImgSrc`, `console.error`, `useCallback`, `e.preventDefault`, `e.stopPropagation`, `setIsResizing`, `Math.max`, `document.removeEventListener`, `props.updateAttributes`, `document.addEventListener`)

## src/components/SettingsMenu.test.tsx
- const `setup()` @9 (calls: `vi.fn`, `render`)

## src/components/SettingsMenu.tsx
- interface `SettingsMenuProps` @15
- const `WIDTHS` @29
- const `SHORTCUTS` @36
- function `Section()` @45
- function `Row()` @62
- function `Segmented()` @77 (calls: `options.map`, `String`, `onChange`)
- function `Toggle()` @113 (calls: `onChange`)
- export function `SettingsMenu()` @141 (calls: `useRef`, `useEffect`, `rootRef.current.contains`, `setOpen`, `document.addEventListener`, `document.removeEventListener`, `update`, `Number`, `LINE_HEIGHTS.map`, `AUTOSAVE_DELAYS.map`, `UI_SCALES.map`, `THEMES.map`, `setCurrentTheme`, `SHORTCUTS.map`)

## src/components/Sidebar.test.tsx
- const `folders` @9
- const `notes` @10
- const `setup()` @15 (calls: `vi.fn`, `render`)
- const `dropOn()` @44

## src/components/Sidebar.tsx
- interface `SidebarProps` @18
- const `formatNoteDate()` @39 (calls: `Date`, `Math.floor`, `Date.now`, `getDate`, `d.getDate`, `d.toLocaleTimeString`, `d.toLocaleDateString`)
- const `smallBtn` @49
- const `sectionLabel` @52
- export function `Sidebar()` @55 (calls: `useState`, `JSON.parse`, `localStorage.getItem`, `useRef`, `document.elementFromPoint`, `el?.closest`, `window.removeEventListener`, `document.body.classList.remove`, `window.clearTimeout`, `setDrag`, `setOverTarget`, `Math.hypot`, `document.body.classList.add`, `findTarget`, `window.setTimeout`, `setOpenFolders`, `notes.find`, `moveNote`, `cleanup`, `window.addEventListener`, `useEffect`, `localStorage.setItem`, `JSON.stringify`, `menuRef.current.contains`, `setMoveMenuFor`, `document.addEventListener`, `document.removeEventListener`, `sort`, `notes.filter`, `newFolderName.trim`, `createFolder`, `setNewFolderName`, `setAddingFolder`, `folders.map`, `startPointerDrag`, `handleSelectNote`, `setRenameValue`, `renameValue.trim`, `renameNote`, `setRenamingNoteId`, `e.stopPropagation`, `formatNoteDate`, `togglePinNote`, `deleteNote`, `moveTargets.map`, `setSidebarOpen`, `createNote`, `pinnedNotes.map`, `submitFolder`, `notes
              .filter`, `isOpen`, `zoneClass`, `setFolderRename`, `renameFolder`, `setRenamingFolderId`, `deleteFolder`, `setPendingDeleteFolder`, `setTimeout`, `items.map`, `inboxNotes.map`)

## src/components/UpdateModal.tsx
- interface `UpdateModalProps` @3
- export function `UpdateModal()` @14 (calls: `setUpdateAvailable`)

## src/constants/app.ts
- export const `AVAILABLE_FONTS` @2
- export const `AVAILABLE_FONT_SIZES` @17
- export const `PASTEL_COLORS` @20

## src/constants/themes.ts
- export interface `ThemeOption` @1
- export const `THEMES` @8

## src/hooks/useAppUpdate.ts
- export function `useAppUpdate()` @4 (calls: `useState`, `useEffect`, `check`, `setUpdateAvailable`, `setIsUpdating`, `update.downloadAndInstall`, `console.error`, `checkForUpdates`)

## src/hooks/useEditorConfig.ts
- export function `useEditorConfig()` @7 (calls: `useEditor`, `createEditorExtensions`, `ReactNodeViewRenderer`, `Array.from`, `items.find`, `item.type.startsWith`, `event.preventDefault`, `item.getAsFile`, `catch`, `then`, `saveImage`, `view.state.schema.nodes.image.create`, `view.state.tr.replaceSelectionWith`, `view.dispatch`, `console.error`, `alert`, `files.find`, `file.type.startsWith`, `view.posAtCoords`, `view.state.tr.insert`)

## src/hooks/useNotes.ts
- export interface `Note` @6
- export interface `Folder` @17
- export const `FOLDER_COLORS` @23
- const `ACTIVE_NOTE_KEY` @32
- const `generateId()` @35 (calls: `Date.now`, `slice`, `toString`, `Math.random`)
- export function `useNotes()` @38 (calls: `useState`, `useRef`, `useEffect`, `initDatabase`, `setDb`, `setNotes`, `setFolders`, `setActiveNoteId`, `setIsLoaded`, `console.error`, `setLoadError`, `String`, `init`, `localStorage.setItem`, `useCallback`, `generateId`, `Date.now`, `db.execute`, `setSaveError`, `notesRef.current.find`, `hasTextContent`, `extractTitle`, `prev.map`, `prev.filter`, `slice`, `toString`, `Math.random`, `name.trim`, `notes.find`)

## src/hooks/usePomodoro.ts
- export function `usePomodoro()` @4 (calls: `useState`, `useRef`, `useEffect`, `window.setInterval`, `setSecondsLeft`, `setIsRunning`, `setTimeout`, `confetti`, `clearInterval`, `setPomodoroMinutes`, `Math.max`, `Math.min`, `Math.floor`, `padStart`, `mins.toString`, `secs
        .toString`, `pomodoroMinutes.toString`)

## src/hooks/useSettings.ts
- const `STORAGE_KEY` @9
- const `load()` @11 (calls: `localStorage.getItem`, `sanitizeSettings`, `JSON.parse`)
- export function `useSettings()` @20 (calls: `useState`, `useEffect`, `localStorage.setItem`, `JSON.stringify`, `document.documentElement.classList.toggle`, `document.documentElement.style.setProperty`, `String`, `useCallback`, `setSettings`, `sanitizeSettings`, `clampZoom`)

## src/services/backup.ts
- const `IMAGES_DIR` @12
- const `BACKUP_VERSION` @13
- interface `BackupNote` @15
- interface `BackupFolder` @28
- const `isSafeImageName()` @37 (calls: `test`)
- export function `createBackup()` @40: Build a .zip containing every note (notes.json) and every image. (calls: `Database.load`, `await db.select`, `JSZip`, `zip.file`, `JSON.stringify`, `Date.now`, `exists`, `zip.folder`, `readDir`, `readFile`, `folder.file`, `zip.generateAsync`, `slice`, `toISOString`, `Date`)
- export function `restoreBackup()` @72: Merge a backup into the current database. Notes with the same id are (calls: `JSZip.loadAsync`, `file.arrayBuffer`, `zip.file`, `JSON.parse`, `notesFile.async`, `Array.isArray`, `exists`, `mkdir`, `pop`, `img.name.split`, `isSafeImageName`, `writeFile`, `img.async`, `Database.load`, `db.execute`, `Date.now`; raises: `Error`)

## src/services/db.ts
- const `STORAGE_KEY` @5
- const `ACTIVE_NOTE_KEY` @6
- const `generateId()` @8 (calls: `Date.now`, `slice`, `toString`, `Math.random`)
- type `Migration` @13
- const `addMissingColumns()` @15 (calls: `await db.select`, `Set`, `existing.map`, `have.has`, `db.execute`)
- const `MIGRATIONS` @27
- const `migrateSchema()` @58 (calls: `await db.select`, `MIGRATIONS.filter`, `m.up`, `db.execute`)
- export const `initDatabase()` @69 (calls: `Database.load`, `dbInstance.execute`, `migrateSchema`, `localStorage.getItem`, `JSON.parse`, `console.error`, `localStorage.removeItem`, `await dbInstance.select`, `result.map`, `folderRows.map`, `loadedNotes.find`, `generateId`, `Date.now`, `loadedNotes.push`, `runGarbageCollection`; raises: `error`)

## src/utils/editorExtensions.ts
- export function `createEditorExtensions()` @18 (calls: `StarterKit.configure`, `Dropcursor.configure`, `Highlight.configure`, `TextStyle.extend`, `this.parent`, `element.style.fontSize?.replace`, `Extension.create`, `editor.state.selection.$from.after`, `run`, `focus`, `insertContentAt`, `editor
              .chain`, `editor.isActive`, `unsetHighlight`, `splitBlock`, `editor.chain`, `editor.getAttributes`, `unsetColor`, `BulletList.extend`, `$anchor.start`, `this.editor.isActive`, `liftListItem`, `this.editor
                  .chain`, `editor.commands.splitListItem`, `OrderedList.extend`, `Placeholder.configure`, `configure`, `TaskItem.extend`, `Image.extend`)

## src/utils/editorToolbar.test.ts
- let `editor` @8
- const `make()` @10 (calls: `Editor`, `createEditorExtensions`)

## src/utils/imageUtils.ts
- const `IMAGES_DIR` @12
- export function `saveImage()` @15 (calls: `exists`, `mkdir`, `blob.arrayBuffer`, `Uint8Array`, `split`, `blob.type.split`, `test`, `rawExt.toLowerCase`, `crypto.randomUUID`, `writeFile`, `console.error`, `Promise`, `FileReader`, `resolve`, `reader.readAsDataURL`)
- export function `runGarbageCollection()` @60 (calls: `db.select`, `exists`, `readDir`, `map`, `entries.filter`, `findOrphanImages`, `notes.map`, `remove`, `console.error`)

## src/utils/noteUtils.test.ts
- const `doc()` @4 (calls: `JSON.stringify`)

## src/utils/noteUtils.ts
- export const `extractTitle()` @5 (calls: `JSON.parse`, `trim`, `text.slice`)
- export const `hasTextContent()` @20 (calls: `JSON.parse`, `node.text.trim`, `Array.isArray`, `node.content.some`, `checkNode`)
- const `UUID_RE` @38
- export const `findOrphanImages()` @41 (calls: `Set`, `content.matchAll`, `referenced.add`, `toLowerCase`, `fileNames.filter`, `name.match`, `referenced.has`, `noteContents.join`, `joined.includes`)

## src/utils/performance.test.ts
- const `time()` @7 (calls: `performance.now`, `fn`)

## src/utils/settings.ts
- export type `PaperWidth` @3
- export interface `Settings` @5
- export const `ZOOM_MIN` @16
- export const `ZOOM_MAX` @17
- export const `ZOOM_STEP` @18
- export const `UI_SCALE_MIN` @20
- export const `UI_SCALE_MAX` @21
- export const `UI_SCALES` @22
- export const `PAPER_WIDTHS` @24
- export const `LINE_HEIGHTS` @31
- export const `AUTOSAVE_DELAYS` @37
- export const `DEFAULT_SETTINGS` @43
- export const `clampUiScale()` @54 (calls: `Math.min`, `Math.max`, `Math.round`)
- export const `clampZoom()` @57 (calls: `Math.min`, `Math.max`, `Math.round`)
- const `oneOf()` @60 (calls: `allowed.includes`)
- export function `sanitizeSettings()` @64: Turn whatever was stored (possibly old, partial or corrupted) into valid settings. (calls: `Number.isFinite`, `clampZoom`, `oneOf`, `Object.keys`, `LINE_HEIGHTS.map`, `AUTOSAVE_DELAYS.map`, `clampUiScale`)

## src-tauri/build.rs
- fn `main()` @1 (calls: `tauri_build::build`)

## src-tauri/src/lib.rs
- fn `get_images_dir()` @5 (calls: `map_err`, `map`, `app_data_dir`, `app_handle
        .path`, `to_string`, `to_string_lossy`, `path.join`, `e.to_string`)
- pub fn `run()` @14 (calls: `expect`, `run`, `invoke_handler`, `plugin`, `tauri::Builder::default`, `build`, `tauri_plugin_updater::Builder::new`, `tauri_plugin_fs::init`, `tauri_plugin_opener::init`, `tauri_plugin_sql::Builder::default`)

## src-tauri/src/main.rs
- fn `main()` @4 (calls: `raku_app_lib::run`)

## vite.config.ts
- const `host` @6

## website/integrations/csp.mjs
- const `META` @6
- export function `completePageCsp()` @9: Hash inline tags emitted by trusted integrations (Starlight's is:inline scripts, for example). (calls: `html.match`, `filter`, `map`, `split`, `s.trim`, `directives.findIndex`, `d.startsWith`, `Set`, `html.matchAll`, `RegExp`, `test`, `trim`, `digest`, `update`, `createHash`, `replace`, `sources.add`, `join`, `directives.join`, `html.replace`, `anchor.test`, `withoutPolicy.replace`; raises: `Error`)
- export function `completeCsp()` @36 (calls: `readdir`, `join`, `entry.isDirectory`, `visit`, `entry.name.endsWith`, `writeFile`, `completePageCsp`, `readFile`, `fileURLToPath`)

## website/scripts/check-build.ts
- const `html` @4
- const `problems` @5
- const `download` @7
- const `downloads` @12
- const `ld` @17
- const `titleOf` @24
- const `metaDescription` @26
- const `robots` @29

## website/scripts/check-security.ts
- const `problems` @6
- let `pages` @7
- function `visit()` @8 (calls: `readdirSync`, `join`, `entry.isDirectory`, `visit`, `entry.name.endsWith`, `readFileSync`, `html.match`, `problems.push`, `html.search`, `Map`, `map`, `filter`, `split`, `d.trim`, `directives.get`, `directives.has`, `scripts.includes`, `scripts.some`, `includes`, `test`, `sources.includes`, `html.matchAll`, `RegExp`, `trim`, `digest`, `update`, `createHash`, `replace`)
- const `config` @52
- const `headers` @53

## website/scripts/render-og.ts
- const `PUBLIC` @8
- const `ORIGIN` @9
- const `TYPES` @10
- const `PAGE` @12
- function `fileFor()` @36 (calls: `replace`, `normalize`, `decodeURIComponent`, `join`, `p.startsWith`, `existsSync`, `isFile`, `statSync`)
- const `browser` @43

## website/scripts/render-stills.ts
- const `DIST` @9
- const `OUT` @10
- const `ORIGIN` @11
- const `SIZES` @12
- const `NAME` @17
- const `TYPES` @19
- function `fileFor()` @25 (calls: `replace`, `normalize`, `decodeURIComponent`, `join`, `p.startsWith`, `existsSync`, `isDirectory`, `statSync`)
- const `build` @34
- const `browser` @40

## website/src/content.config.ts
- export const `collections` @5

## website/src/docsRouteData.ts
- export const `onRequest` @3

## website/src/lib/release.test.ts
- const `URL_OK` @7
- const `file()` @9
- const `FALLBACK` @14

## website/src/lib/release.ts
- export const `RELEASES_URL` @4
- export interface `ReleaseInfo` @6
- const `FALLBACK` @11
- const `isRecord()` @13 (calls: `Array.isArray`)
- function `validInstallerUrl()` @16
- export function `parseRelease()` @23: Turn the parsed contents of update.json into the info the download button needs. Never throws. (calls: `isRecord`, `raw.version.trim`, `test`, `validInstallerUrl`)
- export function `loadRelease()` @37: Read update.json from the repository root (build runs with the website folder as cwd). Never throws. (calls: `parseRelease`, `JSON.parse`, `readFileSync`)

## website/src/notebook/extensions.ts
- export function `notebookExtensions()` @12: The same pieces the app's editor is built from (the app has more, like images and fonts). No links: pasted (calls: `StarterKit.configure`, `TaskItem.configure`, `Placeholder.configure`)

## website/src/notebook/mount.ts
- const `COMMANDS` @7: What each toolbar button (data-cmd) does, and how to tell it is on. Nothing is stored: the text lives in the editor only.
- export function `mountNotebook()` @20: Turns the plain sample note in `el` into a live editor and wires the toolbar buttons (`data-cmd`) in `toolbar`. (calls: `Editor`, `el.replaceChildren`, `notebookExtensions`, `toolbar.querySelectorAll`, `buttons.forEach`, `active`, `b.classList.toggle`, `b.setAttribute`, `String`, `closest`, `run`, `cmd.run`, `focus`, `editor.chain`, `refresh`, `e.preventDefault`, `toolbar.addEventListener`, `editor.on`, `toolbar.removeEventListener`, `editor.destroy`)

## website/src/notebook/sample.ts
- const `task()` @1
- export const `SAMPLE_HTML` @5: The note the notebook opens with. The page renders it before the editor loads, and the editor starts from it.

## website/src/scene/budget.test.ts
- function `triangles()` @17: Triangles drawn for an object (every instance counts). (calls: `o.traverse`, `g.getAttribute`, `Math.round`)

## website/src/scene/camera.ts
- export const `CAMERA` @2: Low camera at the foot of the hill, looking up at the gate (same idea as mockups/landing-hero.html).
- const `MAX_PARALLAX` @8
- const `clamp()` @9 (calls: `Math.max`, `Math.min`)
- export function `parallaxOffset()` @12: Pointer position in -1..1 on both axes -> small camera shift in world units. (calls: `clamp`)
- export function `journeyParallax()` @18: The parallax shift while scrolling through the journey. It is the full amount until the fox close-up, where the (calls: `parallaxOffset`, `Math.min`, `Math.max`)

## website/src/scene/capabilities.test.ts
- const `ok` @4

## website/src/scene/capabilities.ts
- export interface `Env` @1
- export function `shouldRunScene()` @11: The live scene runs only on a capable desktop browser; otherwise the still image stays.
- export function `isSoftwareRenderer()` @16: True for the names a browser reports for a WebGL renderer that draws on the CPU. (calls: `test`)
- export function `detectEnv()` @20 (calls: `URLSearchParams`, `params.has`, `win.document.createElement`, `canvas.getContext`, `gl?.getExtension`, `isSoftwareRenderer`, `String`, `gl.getParameter`, `win.matchMedia`)
- export function `cappedPixelRatio()` @47: Pixel ratio the renderer should use: the screen's ratio, capped at 2 to bound GPU work. (calls: `Number.isFinite`, `Math.min`)
- const `SLOW_FRAME_MS` @51
- const `MIN_SCALE` @52
- const `GIVE_UP_MS` @53
- const `GIVE_UP_AT_FLOOR_MS` @54
- export function `adaptPixelRatioScale()` @57: Render scale for the next period: step down 25% when the average frame is slow, never below the floor. (calls: `Number.isFinite`, `Math.max`)
- export function `shouldGiveUp()` @66: Whether the scene is too slow to be worth running: the page should go back to the picture. Looks at the average frame (calls: `Number.isFinite`)

## website/src/scene/clouds.test.ts
- const `clouds()` @6
- function `recorder()` @67: A stand-in for a canvas context that records every point drawn and every fill colour used. (calls: `String`, `fills.push`, `points.push`)

## website/src/scene/clouds.ts
- export const `CLOUDS` @7: Auspicious-cloud motifs (puffs with spiral curls and a trailing tail) on a far dome, drifting right to left.
- export function `cloudAzimuth()` @10: Azimuth in degrees at time t for a cloud that starts at startAz and drifts left, wrapping round the dome.
- export function `cloudEdgeFade()` @17: 0 at the wrap-around edges, 1 in the middle, so a cloud fades out and in instead of popping. (calls: `Math.min`, `Math.max`)
- export const `CLOUD_TEX` @24
- export interface `Ctx2D` @27: The 2D calls the artwork needs, so it can be drawn on a canvas or on a recording stand-in in tests.
- type `Pt` @36
- interface `Variant` @38
- export const `CLOUD_VARIANTS` @41
- const `lerp()` @47
- function `bezier()` @48
- function `ribbon()` @57: A line of varying thickness along `pts` (thickness w0 at the start, w1 at the end), filled as one polygon. (calls: `Math.max`, `Math.min`, `Math.hypot`, `lerp`, `left.push`, `right.push`, `ctx.beginPath`, `ctx.moveTo`, `ctx.lineTo`, `ctx.closePath`, `ctx.fill`, `ctx.arc`)
- function `spiral()` @79: A tapering curl that winds in towards (cx, cy). (calls: `Math.pow`, `pts.push`, `Math.cos`, `Math.sin`, `ribbon`)
- export function `drawCloudMask()` @94: Paints one cloud as a mask: white where the cloud is, black where a swirl line cuts through it, black outside. (calls: `mulberry32`, `ctx.fillRect`, `Math.max`, `Math.abs`, `rng`, `puffs.push`, `ctx.beginPath`, `ctx.arc`, `ctx.fill`, `ctx.moveTo`, `ctx.lineTo`, `ctx.closePath`, `ctx.bezierCurveTo`, `lerp`, `slice`, `sort`, `byRadius.forEach`, `spiral`, `arc.push`, `Math.cos`, `Math.sin`, `ribbon`, `spine.push`, `bezier`)
- function `makeArtwork()` @167: Bake the shaded body and moonlit rim once. Each cloud still needs just one quad and one texture lookup. (calls: `document.createElement`, `canvas.getContext`, `drawCloudMask`, `ctx.getImageData`, `Uint8Array`, `getHex`, `lerp`, `Color`, `Math.min`, `Math.max`, `map`, `ctx.putImageData`, `CanvasTexture`)
- export function `buildClouds()` @203 (calls: `mulberry32`, `rng`, `Group`, `CLOUD_VARIANTS.map`, `makeArtwork`, `Array.from`, `r`, `Math.tan`, `MeshBasicMaterial`, `Mesh`, `PlaneGeometry`, `group.add`, `cloudAzimuth`, `Math.sin`, `it.mesh.position.set`, `Math.cos`, `it.mesh.lookAt`, `cloudEdgeFade`, `place`)

## website/src/scene/constellation.test.ts
- const `cam()` @9 (calls: `PerspectiveCamera`)
- const `forward()` @13 (calls: `c.getWorldDirection`, `Vector3`)

## website/src/scene/constellation.ts
- export const `CONSTELLATION` @9
- const `RAD` @20
- const `clamp()` @21 (calls: `Math.min`, `Math.max`)
- const `smoothstep()` @22 (calls: `clamp`)
- const `ease()` @23 (calls: `Math.pow`)
- function `direction()` @26: Same convention as the star dome: x right, y up, the camera looks down -z. (calls: `multiplyScalar`, `Vector3`, `Math.cos`, `Math.sin`)
- export const `starDirection()` @30 (calls: `direction`)
- export interface `ConstellationState` @34
- export function `constellationHeightVh()` @42: Total height of the scroll area in screen heights (the pinned frame itself takes one more).
- export function `constellationTimeline()` @46 (calls: `Math.max`, `clamp`)
- function `focusDirection()` @57: Where the camera looks when it is up in the sky: the middle of the sky, leaning halfway toward the current star. (calls: `clamp`, `Math.floor`, `smoothstep`, `direction`, `Math.min`, `normalize`, `add`, `a.multiplyScalar`, `b.multiplyScalar`, `multiplyScalar`, `star.multiplyScalar`)
- export function `constellationPose()` @67: Where the camera is and looks when it tilts up toward the sky. At tilt 0 it is exactly the hero camera. (calls: `ease`, `clamp`, `Vector3`, `normalize`, `sub`, `add`, `hero.multiplyScalar`, `multiplyScalar`, `focusDirection`)
- export function `applyConstellationCamera()` @76: Tilts the hero camera up toward the sky. At tilt 0 it is exactly the hero camera; it is never rolled. (calls: `constellationPose`, `camera.position.copy`, `camera.up.set`, `camera.lookAt`, `addScaledVector`, `position.clone`, `camera.updateProjectionMatrix`)
- export function `projectStars()` @85: Where each feature star is on screen, in CSS pixels, so the page can put a label next to it. (calls: `camera.getWorldDirection`, `Vector3`, `CONSTELLATION.stars.map`, `starDirection`, `project`, `dir.clone`, `forward.dot`, `normalize`, `Math.abs`)
- const `QUAD_VERT` @97
- const `STAR_FRAG` @99
- const `LINE_FRAG` @114
- function `ribbon()` @126: A thin strip along the great circle from a to b, trimmed at both ends so it stops short of the stars. (calls: `normalize`, `a.clone`, `b.clone`, `ua.angleTo`, `add`, `multiplyScalar`, `ua.clone`, `Math.sin`, `ub.clone`, `at`, `sub`, `Math.min`, `crossVectors`, `Vector3`, `p.clone`, `pos.push`, `uv.push`, `idx.push`, `BufferGeometry`, `g.setAttribute`, `Float32BufferAttribute`, `g.setIndex`)
- export function `buildConstellation()` @149: One bright star per feature, joined by lines that draw themselves as the features are passed. (calls: `Group`, `Math.tan`, `CONSTELLATION.stars.map`, `ShaderMaterial`, `Mesh`, `PlaneGeometry`, `mesh.position.copy`, `starDirection`, `mesh.lookAt`, `group.add`, `map`, `CONSTELLATION.stars.slice`, `ribbon`, `getFeature`, `stars.forEach`, `smoothstep`, `Math.abs`, `Math.max`, `lines.forEach`, `clamp`)

## website/src/scene/dispose.ts
- export function `disposeTree()` @4: Frees geometry, materials and their colour/alpha maps (disposing a material alone does not free textures). (calls: `root.traverse`, `m.geometry?.dispose`, `Array.isArray`, `x.alphaMap?.dispose`, `x.map?.dispose`, `x.dispose`)

## website/src/scene/flowers.test.ts
- const `flowers` @12

## website/src/scene/flowers.ts
- export const `FLOWERS` @17
- export const `POPPY_COLORS` @18
- const `SUSAN_COLORS` @19
- export interface `Flower` @21
- const `camera` @30
- function `groundAt()` @37: The ground point seen through a screen position (NDC), or null if the ray never meets the hill. (calls: `normalize`, `sub`, `unproject`, `Vector3`, `addScaledVector`, `p.copy`, `hillHeight`, `p.setY`)
- export function `scatterFlowers()` @48: Scatter flowers over the part of the hill the camera sees, avoiding the river, the fox, the gate feet and the tree. (calls: `mulberry32`, `rng`, `Math.cos`, `Math.sin`, `groundAt`, `r`, `riverDistance`, `riverWidthAt`, `keepOut.some`, `Math.hypot`, `Math.pow`, `out.push`, `Math.min`, `Math.max`, `Math.floor`, `make`)
- function `combine()` @83 (calls: `mergeGeometries`, `parts.forEach`, `part.dispose`)
- function `paint()` @89 (calls: `Float32Array`, `geometry.getAttribute`, `colors.set`, `geometry.setAttribute`, `Float32BufferAttribute`)
- function `petalGeometry()` @97: Rounded petals with a raised edge, a central crease and gentle ripples, facing local +z. (calls: `Math.cos`, `Math.sin`, `positions.push`, `Math.abs`, `colors.push`, `uv.push`, `indices.push`, `BufferGeometry`, `geometry.setAttribute`, `Float32BufferAttribute`, `geometry.setIndex`, `geometry.computeVertexNormals`)
- function `seedHead()` @131: A domed seed head with a subtle seed pattern in the vertex colours. (calls: `SphereGeometry`, `geometry.rotateX`, `geometry.scale`, `geometry.translate`, `geometry.getAttribute`, `Float32Array`, `Math.sin`, `positions.getX`, `positions.getY`, `positions.getZ`, `colors.set`, `rgb.map`, `geometry.setAttribute`, `Float32BufferAttribute`)
- function `poppyHead()` @148 (calls: `parts.push`, `petalGeometry`, `Math.sin`, `seedHead`, `SphereGeometry`, `pollen.translate`, `Math.cos`, `paint`, `combine`)
- function `susanHead()` @165 (calls: `parts.push`, `petalGeometry`, `Math.sin`, `seedHead`, `combine`)
- function `leafGeometry()` @176: Pointed, gently folded leaves, attached at alternating heights on the stem. (calls: `Math.cos`, `Math.sin`, `Math.abs`, `positions.push`, `colors.push`, `uv.push`, `indices.push`, `BufferGeometry`, `geometry.setAttribute`, `Float32BufferAttribute`, `geometry.setIndex`, `geometry.computeVertexNormals`)
- function `stemGeometry()` @204 (calls: `CylinderGeometry`, `stem.translate`, `stem.getAttribute`, `positions.setX`, `positions.getX`, `Math.sin`, `positions.getY`, `stem.computeVertexNormals`, `combine`, `paint`, `leafGeometry`)
- export function `buildFlowers()` @216 (calls: `scatterFlowers`, `Group`, `MeshToonMaterial`, `InstancedMesh`, `stemGeometry`, `mat`, `flowers.filter`, `susanHead`, `poppyHead`, `forEach`, `group.add`, `Color`, `susanFlowers.forEach`, `susans.setColorAt`, `col.setHex`, `poppyFlowers.forEach`, `poppies.setColorAt`, `Matrix4`, `Quaternion`, `Euler`, `Vector3`, `flowers.forEach`, `Math.sin`, `windGust`, `q.setFromEuler`, `e.set`, `stems.setMatrixAt`, `m.compose`, `p.set`, `s.set`, `applyQuaternion`, `top.set`, `facing.setFromEuler`, `Math.cos`, `multiply`, `hq.copy`, `spin.setFromAxisAngle`, `head.setMatrixAt`, `write`)

## website/src/scene/fox.ts
- export const `FOX` @15: A fox sitting on the hill between the gate and the tree, facing left and a little toward the camera.
- const `FOX_SCALE` @18: Stylized: bigger than life so it reads from across the hill. z is mirrored so that, turned to face left,
- export function `foxLocalToWorld()` @21: Fox-local coordinates (x forward, y up, z to the side) to world coordinates. (calls: `compose`, `Matrix4`, `Vector3`, `hillHeight`, `setFromEuler`, `Quaternion`, `Euler`, `applyMatrix4`)
- export const `FOX_TAG` @32: The wooden tag (an ema, like the prayer tablets at a shrine) on the fox's chest, in fox-local coordinates.
- const `FACET` @34
- const `BODY_Y` @35
- const `HEAD_AT` @36
- const `MAX_YAW` @37
- export function `lookAngles()` @41: How far the head turns (yaw, sideways) and tips (pitch) to look at a point, given as an offset from the head in (calls: `Math.max`, `Math.min`, `clamp`, `Math.atan2`, `Math.hypot`)
- export function `foxCamera()` @50: The close-up for the download: in front of the fox, low, with the face above the tag. (calls: `foxLocalToWorld`, `lookPose`)
- export function `buildFox()` @55 (calls: `MeshToonMaterial`, `mat`, `Group`, `Mesh`, `SphereGeometry`, `mesh.scale.set`, `mesh.position.set`, `parent.add`, `mulberry32`, `faceted`, `gem`, `IcosahedronGeometry`, `rock`, `forEach`, `CylinderGeometry`, `head.position.set`, `root.add`, `ConeGeometry`, `muzzle.rotateZ`, `OctahedronGeometry`, `map`, `eye.position.set`, `normalize`, `Vector3`, `eye.quaternion.setFromUnitVectors`, `ball`, `head.add`, `translate`, `ear.position.set`, `cone`, `tail.position.set`, `CubicBezierCurve3`, `facetedTube`, `Math.sin`, `tail.add`, `ring.position.set`, `TorusGeometry`, `ring.add`, `tag.position.set`, `Shape`, `closePath`, `lineTo`, `outline.moveTo`, `ExtrudeGeometry`, `slab.translate`, `slab.rotateY`, `plaque.position.set`, `tag.add`, `from.distanceTo`, `multiplyScalar`, `add`, `cord.position.copy`, `cord.quaternion.setFromUnitVectors`, `sub`, `to.clone`, `root.position.set`, `hillHeight`, `root.scale.set`, `ears.map`, `createReaction`, `nod.kick`, `wag.kick`, `earWiggle.kick`, `p.clone`, `windGust`, `nod.step`, `wag.step`, `earWiggle.step`, `root.updateWorldMatrix`, `lookAngles`, `root.worldToLocal`, `target.clone`, `Math.exp`, `Math.max`, `Math.pow`, `eyes.forEach`)

## website/src/scene/grass.ts
- function `bladeGeometry()` @13: One blade: 1 unit tall, slightly bent, tapering to a point. (calls: `pos.push`, `idx.push`, `BufferGeometry`, `g.setAttribute`, `Float32BufferAttribute`, `g.setIndex`, `g.computeVertexNormals`)
- interface `Layer` @32
- export function `buildGrass()` @34 (calls: `mulberry32`, `rng`, `bladeGeometry`, `Group`, `Matrix4`, `Quaternion`, `Euler`, `Vector3`, `e.set`, `mesh.setMatrixAt`, `m.compose`, `p.set`, `q.setFromEuler`, `s.set`, `InstancedMesh`, `MeshToonMaterial`, `Color`, `r`, `Math.abs`, `riverDistance`, `riverWidthAt`, `hillHeight`, `blades.push`, `compose`, `group.add`, `all.push`, `layers.reduce`, `blades.forEach`, `Math.sin`, `windGust`)

## website/src/scene/hill.ts
- export function `hillHeight()` @7: Ground height at (x, z). The camera is at y = 0 at the foot of the hill; ground rises with distance and toward the right. (calls: `Math.max`, `Math.sin`)
- export function `buildHill()` @14: Main hill and a lower far hill behind it. The main hill receives shadows. (calls: `PlaneGeometry`, `g.rotateX`, `pos.setY`, `fn`, `pos.getX`, `pos.getZ`, `g.computeVertexNormals`, `Mesh`, `MeshToonMaterial`, `Color`, `make`, `Math.max`, `Math.sin`, `Group`, `group.add`)

## website/src/scene/index.ts
- export interface `SceneOptions` @34
- export interface `JourneyProjection` @47
- export interface `ScenePart` @55
- type `Builder` @61: Builders for each piece of the world; later tasks add torii, tree, grass and petals here.
- interface `Entry` @63: What each piece does with the moon's shadow map: casts a shadow, receives one, or neither.
- const `BUILDERS` @64
- function `toonGradient()` @78 (calls: `Uint8Array`, `DataTexture`)
- export function `mountScene()` @86 (calls: `WebGLRenderer`, `host.appendChild`, `Scene`, `PerspectiveCamera`, `toonGradient`, `DirectionalLight`, `sun.position.set`, `configureMoonLight`, `scene.add`, `AmbientLight`, `Group`, `buildSky`, `sky.setBlend`, `copy`, `sky.fogColor`, `scene.remove`, `disposeTree`, `BUILDERS.map`, `entry.build`, `part.object.traverse`, `parts.push`, `buildShootingStars`, `parts.find`, `named`, `filter`, `map`, `buildConstellation`, `getState`, `parts.forEach`, `world.add`, `tree.object.attach`, `Color`, `Fog`, `foxCamera`, `Raycaster`, `Vector2`, `starPositions`, `createSceneTap`, `canvas.getBoundingClientRect`, `ndc.set`, `raycaster.setFromCamera`, `raycaster.intersectObjects`, `classifyHit`, `hit.point.clone`, `nearestPoint`, `projectPoints`, `tap.cancel`, `tap.begin`, `pick`, `tap.end`, `activateSceneHit`, `treeLocalToWorld`, `Vector3`, `parallaxOffset`, `camera.position.set`, `camera.lookAt`, `Math.max`, `renderer.setPixelRatio`, `cappedPixelRatio`, `renderer.setSize`, `camera.updateProjectionMatrix`, `dispose`, `opts.onFail`, `shouldGiveUp`, `fail`, `adaptPixelRatioScale`, `resize`, `fpsText`, `Math.round`, `has`, `URLSearchParams`, `document.createElement`, `requestAnimationFrame`, `Math.min`, `trackFrame`, `decayWind`, `opts.journey?.getState`, `journeyPose`, `journeyParallax`, `camera.up.set`, `addScaledVector`, `pose.position.clone`, `tintSky`, `placeCamera`, `foxLocalToWorld`, `fox.look`, `raycaster.ray.at`, `camera.position.distanceTo`, `lookingAtSky`, `p.update`, `camera.updateMatrixWorld`, `opts.journey.onProject`, `projectStars`, `lanterns?.centres`, `p.setY`, `Math.abs`, `renderer.render`, `cancelAnimationFrame`, `start`, `stop`, `IntersectionObserver`, `sync`, `tap.move`, `performance.now`, `pushWind`, `pointerWind`, `Math.hypot`, `ResizeObserver`, `e.preventDefault`, `io.disconnect`, `ro.disconnect`, `document.removeEventListener`, `window.removeEventListener`, `document.documentElement.removeEventListener`, `canvas.removeEventListener`, `toon.dispose`, `renderer.dispose`, `overlay?.remove`, `canvas.remove`, `canvas.addEventListener`, `rebuild`, `ro.observe`, `io.observe`, `document.addEventListener`, `window.addEventListener`, `document.documentElement.addEventListener`)

## website/src/scene/interact.ts
- export type `SceneHit` @4
- export function `createSceneTap()` @7: Only a press and release on the same object counts. Dragging, scrolling and cancellation abandon the tap. (calls: `Math.hypot`, `move`)
- export function `activateSceneHit()` @29: Dispatch to just the selected object; the tree owns its petal shower, without changing the scene's wind. (calls: `targets.fox?.react`, `targets.tree?.shake`, `targets.petals?.burst`, `lerp`, `targets.blossom.clone`, `targets.shooting?.shoot`)
- export function `nearestPoint()` @45: The index of the point nearest (x, y) that is visible and within `maxDist` pixels, or -1 if there is none. (calls: `points.forEach`, `Math.hypot`)
- export function `classifyHit()` @57: What a ray hit: the fox, the tree, or something else that only gets in the way (the hill, the gate). Looks up
- export function `pointerWind()` @68: How much wind a pointer movement makes: nothing for a slow drift, more for a quick sweep (distance in pixels, over (calls: `Math.min`)

## website/src/scene/journey.test.ts
- const `FOX` @8
- const `dirOf()` @9 (calls: `journeyPose`, `journeyAt`)
- const `SCROLLS` @10

## website/src/scene/journey.ts
- export const `JOURNEY` @7: Scroll lengths in screen heights. The hero, tilt and feature lengths come from CONSTELLATION.
- const `STARS_END` @16
- const `WRITE_END` @17
- const `NUMBERS_START` @18
- const `NUMBERS_END` @19
- export const `JOURNEY_AT` @22: Where each chapter starts, in screen heights of scroll (what the "Features" link and focus handling scroll to).
- export function `journeyHeightVh()` @29
- const `clamp()` @33 (calls: `Math.min`, `Math.max`)
- const `smooth()` @34 (calls: `clamp`)
- const `smoothstep()` @35 (calls: `smooth`)
- export interface `JourneyState` @37
- export function `journeyAt()` @55 (calls: `Math.max`, `constellationTimeline`, `Math.min`, `clamp`, `smooth`, `smoothstep`)
- export interface `Pose` @79: A camera: where it is, the unit direction it looks in, and the field of view. Never rolled.
- export function `lookPose()` @81 (calls: `Vector3`, `normalize`, `sub`)
- export const `GLADE` @87: In the glade by the cherry tree: the notebook floats on the left, the tree fills the right.
- export const `TREE_VIEW` @89: Across the glade from the cherry tree, looking at the lanterns that hang from its branches.
- const `mix()` @91 (calls: `lerp`, `a.position.clone`, `normalize`, `a.direction.clone`)
- export function `journeyPose()` @98: The camera for a point in the journey. `fox` is the close-up of the fox, which the scene knows and this module does not. (calls: `constellationPose`, `mix`, `smooth`)
- export function `lookingAtSky()` @107: True while the camera is looking up at the stars, with the whole hill (and its flowers) below the bottom of the screen.
- export function `projectPoints()` @112: Where points in the world are on screen, in CSS pixels, so the page can put DOM next to them. (calls: `camera.updateMatrixWorld`, `points.map`, `applyMatrix4`, `p.clone`, `project`, `Math.abs`)
- export type `Chapter` @127
- export function `chapterAt()` @130: Which chapter a scroll position is in (the notebook's chapter runs on until the camera has left the glade).
- export function `chapterScroll()` @139: A scroll position where a chapter is fully shown: what focusing something in that chapter scrolls to.

## website/src/scene/lanterns.test.ts
- const `treeCamera()` @10 (calls: `PerspectiveCamera`, `cam.position.copy`, `cam.lookAt`, `add`, `TREE_VIEW.position.clone`, `cam.updateMatrixWorld`, `cam.updateProjectionMatrix`)

## website/src/scene/lanterns.ts
- const `HANGS` @13: The four paper lanterns hang from branches of the cherry tree: which branch, how far along it (0..1), and the
- const `BODY_HALF` @19
- export const `LANTERN_ATTACH` @22: Where each cord is tied to its branch (world coordinates).
- export const `LANTERNS` @24: Where each lantern's centre hangs at rest (world coordinates).
- export const `LANTERN_CORDS` @26: Length of each cord, from the branch to the top of its lantern.
- const `PAPER_HALF` @28
- const `paperRadius()` @29 (calls: `Math.max`, `Math.cos`)
- function `paperGeometry()` @32: The shoulders taper into the lacquer collars; small folds give the paper a ribbed silhouette. (calls: `Array.from`, `Math.sin`, `Math.cos`, `Vector2`, `paperRadius`, `LatheGeometry`)
- function `paperMaterial()` @42: Procedural paper: fine fibres, bamboo ribs and a warmer centre, without downloaded textures. (calls: `MeshToonMaterial`, `replace`, `shader.vertexShader.replace`, `shader.fragmentShader.replace`)
- function `merged()` @67 (calls: `mergeGeometries`, `parts.forEach`, `part.dispose`)
- function `ring()` @73 (calls: `TorusGeometry`, `geometry.rotateX`, `geometry.translate`)
- const `LANTERN_MOTIFS` @80
- type `LanternMotif` @81
- function `motifShapes()` @84: Vector emblems stay crisp on close-ups and need no fonts or image textures. (calls: `Shape`, `closePath`, `bezierCurveTo`, `quadraticCurveTo`, `petal.moveTo`, `Vector2`, `Array.from`, `map`, `petal.getPoints`, `point.rotateAround`, `centre.absarc`, `lineTo`, `mask.moveTo`, `Path`, `ear.moveTo`, `eye.moveTo`, `mask.holes.push`, `nose.moveTo`, `points.map`, `Math.hypot`, `polygon`, `roof.moveTo`, `stroke`, `sunHole.moveTo`, `sun.holes.push`)
- function `crestGeometry()` @149: Repeat one emblem around its lantern, curved to the paper instead of floating on a flat decal. (calls: `Shape`, `frame.absarc`, `Path`, `hole.absarc`, `frame.holes.push`, `motifShapes`, `ShapeGeometry`, `geometry.getAttribute`, `positions.getX`, `positions.getY`, `paperRadius`, `positions.setXYZ`, `Math.sin`, `Math.cos`, `geometry.computeVertexNormals`, `parts.push`, `merged`)
- function `glowMaterial()` @173: A soft halo, billboarded in the shader so it still faces the viewer while the lantern swings. (calls: `ShaderMaterial`, `Color`)
- export function `buildLanterns()` @196: Four glowing paper lanterns on cords tied to the tree's branches. They are always there; the numbers chapter (calls: `Group`, `MeshToonMaterial`, `paperGeometry`, `LANTERN_CORDS.map`, `createPendulum`, `Vector3`, `HANGS.map`, `l.position.copy`, `paperMaterial`, `Mesh`, `bodies.push`, `translate`, `CylinderGeometry`, `TorusGeometry`, `merged`, `ring`, `SphereGeometry`, `crestGeometry`, `threads.push`, `Math.sin`, `Math.cos`, `tassel.add`, `glowMaterial`, `PlaneGeometry`, `l.add`, `details.push`, `group.add`, `bodies.map`, `body.getWorldPosition`, `windGust`, `group.updateWorldMatrix`, `Math.atan2`, `lanterns.forEach`, `applyMatrix4`, `pivot.copy`, `step`)

## website/src/scene/lowpoly.test.ts
- const `triangles()` @6 (calls: `g.getAttribute`)
- const `normalOf()` @7 (calls: `g.getAttribute`, `Vector3`, `n.getX`, `n.getY`, `n.getZ`)
- const `colorOf()` @11 (calls: `g.getAttribute`, `c.getX`, `c.getY`, `c.getZ`)

## website/src/scene/lowpoly.ts
- export function `faceted()` @5: A copy of `geometry` with flat faces, each face a slightly different shade of `color` (up to `jitter` lighter or (calls: `geometry.toNonIndexed`, `geometry.clone`, `g.computeVertexNormals`, `Color`, `g.getAttribute`, `Float32Array`, `rng`, `colors.set`, `g.setAttribute`, `BufferAttribute`)
- export function `facetedTube()` @20: A flat-shaded tube along `curve` with a few sides, wider or narrower as `radiusAt(t)` says, and a color along its (calls: `curve.computeFrenetFrames`, `curve.getPointAt`, `radiusAt`, `Array.from`, `addScaledVector`, `c.clone`, `Math.cos`, `Math.sin`, `ring`, `Color`, `colorAt`, `rng`, `pos.push`, `col.push`, `BufferGeometry`, `g.setAttribute`, `Float32BufferAttribute`, `g.computeVertexNormals`)

## website/src/scene/moon.ts
- export const `MOON` @6: The moon sits on a far dome, up and to the left of the headline.
- export const `MOON_RADIUS` @9: World radius of the disc itself (the quad around it also carries the glow).
- const `QUAD_RADII` @11
- const `CRATERS` @14
- export function `buildMoon()` @20: Glow, disc and craters are drawn by one fragment shader on a single quad. Separate meshes lying in the (calls: `Group`, `group.position.set`, `Math.cos`, `Math.sin`, `group.lookAt`, `Color`, `join`, `CRATERS.map`, `x.toFixed`, `y.toFixed`, `s.toFixed`, `ShaderMaterial`, `toFixed`, `QUAD_RADII.toFixed`, `Mesh`, `PlaneGeometry`, `group.add`)

## website/src/scene/palette.ts
- export interface `Palette` @1
- export const `PALETTE` @24: The night scene: the same colors as the home page tokens and the SVG prototype.

## website/src/scene/pendulum.ts
- export function `createPendulum()` @2: A lantern's angle in world space, driven by the velocity changes of its moving tie point. (calls: `Math.min`, `Math.ceil`, `Math.cos`, `Math.sin`, `Math.max`, `Math.abs`, `Math.sign`)

## website/src/scene/petals.ts
- export const `PETAL_BOUNDS` @12: Volume the petals live in (meters). They enter at the right edge and leave at the left.
- export interface `PetalState` @14
- const `MAX_DT` @28
- function `respawn()` @30 (calls: `r`, `Math.max`, `hillHeight`)
- export function `createPetals()` @42 (calls: `Float32Array`, `Uint8Array`, `mulberry32`, `respawn`)
- export function `burstPetals()` @61: Shakes `amount` petals loose around `origin` (a point in the blossom): they fly outward and up, then drift and fall (calls: `r`, `Math.acos`, `Math.cbrt`, `Math.sin`, `Math.cos`)
- export function `stepPetals()` @87 (calls: `Math.min`, `Math.max`, `Math.exp`, `Math.sin`, `Math.cos`, `hillHeight`, `respawn`)
- function `petalGeometry()` @106 (calls: `Shape`, `s.moveTo`, `s.bezierCurveTo`, `ShapeGeometry`)
- export function `buildPetals()` @112 (calls: `createPetals`, `InstancedMesh`, `petalGeometry`, `MeshToonMaterial`, `Matrix4`, `Quaternion`, `Euler`, `Vector3`, `p.set`, `e.set`, `mesh.setMatrixAt`, `m.compose`, `q.setFromEuler`, `write`, `stepPetals`, `windGust`, `burstPetals`)

## website/src/scene/reaction.ts
- export function `createReaction()` @2: A local damped motion. A click adds velocity without resetting the current pose or phase. (calls: `Math.sqrt`, `Math.max`, `Math.min`, `Math.exp`, `Math.cos`, `Math.sin`)

## website/src/scene/river.ts
- export const `RIVER` @7: Centerline in (x, z), from far (small z magnitude last) to near the camera. The river flows toward the viewer.
- export const `riverWidthAt()` @14: River width at u = 0 (far end) .. 1 (near end). (calls: `Math.pow`)
- const `curve` @16
- const `SAMPLES` @17
- const `samples` @18
- export function `riverFrame()` @21: Centre point of the river at u (0 far .. 1 near), and the horizontal unit vector pointing to the left of the flow. (calls: `normalize`, `setY`, `curve.getTangent`, `curve.getPoint`, `crossVectors`, `Vector3`)
- export function `riverDistance()` @27: Distance in the ground plane from (x, z) to the river centerline. (calls: `Math.max`, `Math.min`, `Math.hypot`)
- const `VERT` @38
- const `FRAG` @46
- export function `buildRiver()` @78 (calls: `Vector3`, `normalize`, `setY`, `curve.getTangent`, `crossVectors`, `riverWidthAt`, `pos.push`, `hillHeight`, `uv.push`, `idx.push`, `BufferGeometry`, `geo.setAttribute`, `Float32BufferAttribute`, `geo.setIndex`, `ShaderMaterial`, `lerp`, `Color`, `Mesh`)

## website/src/scene/riverside.ts
- export const `RIVERSIDE` @13: A little life along the water: stones with foam, reed clumps with cattails, lily pads and petals drifting by.
- const `WATER_LIFT` @15
- export function `riverPoint()` @18: Ground point beside the river at river position u (0 far .. 1 near), `offset` units to the left of the flow (negative: right). (calls: `riverFrame`, `Vector3`, `hillHeight`)
- function `groundNormal()` @25: Unit ground normal at (x, z), from the hill's own height function. (calls: `normalize`, `Vector3`, `hillHeight`)
- function `reedBladeGeometry()` @30 (calls: `pos.push`, `idx.push`, `BufferGeometry`, `g.setAttribute`, `Float32BufferAttribute`, `g.setIndex`, `g.computeVertexNormals`)
- export function `buildRiverside()` @46 (calls: `mulberry32`, `rng`, `Group`, `Matrix4`, `Quaternion`, `Euler`, `Vector3`, `r`, `MeshToonMaterial`, `InstancedMesh`, `IcosahedronGeometry`, `toonMat`, `rotateX`, `RingGeometry`, `MeshBasicMaterial`, `U`, `riverWidthAt`, `riverPoint`, `e.set`, `stones.setMatrixAt`, `m.compose`, `tmp.set`, `q.setFromEuler`, `sc.set`, `stones.setColorAt`, `offsetHSL`, `Color`, `Mesh`, `foamMat.clone`, `groundNormal`, `ring.quaternion.setFromUnitVectors`, `ring.position.set`, `ring.scale.setScalar`, `group.add`, `foam.push`, `blades.push`, `reedBladeGeometry`, `blades.filter`, `CapsuleGeometry`, `blades.forEach`, `Math.sin`, `windGust`, `reeds.setMatrixAt`, `add`, `applyQuaternion`, `cattails.setMatrixAt`, `placeReeds`, `CircleGeometry`, `multiply`, `pad.quaternion.setFromUnitVectors`, `pad.position.set`, `pad.scale.setScalar`, `scale`, `Array.from`, `floaters.forEach`, `f.mesh.quaternion.setFromUnitVectors`, `f.mesh.position.set`, `f.mesh.scale.setScalar`, `Math.min`, `place`)

## website/src/scene/rng.ts
- export function `mulberry32()` @2: Small seeded random number generator (mulberry32), so generated shapes are identical on every load. (calls: `Math.imul`)

## website/src/scene/shadows.ts
- export const `SUN_POSITION` @9: Where the sun is (the scene's main directional light, which lights the objects from the front-left).
- export const `LIGHTING` @16: Light levels. The moon's light is the one that casts shadows. It shines from behind the scene, so on its own it
- export function `moonDirection()` @19: Unit vector from the origin toward the moon (same placement as the moon disc). (calls: `Vector3`, `Math.cos`, `Math.sin`)
- export const `SHADOW_TARGET` @25: Where the shadow maker looks: the middle of the area that matters (gate, tree, fox and the ground in front).
- const `SHADOW_DISTANCE` @26
- export function `shadowFitPoints()` @29: Points that must fall inside the shadow map: everything that casts a shadow, and the ground that receives it. (calls: `hillHeight`, `pts.push`, `Vector3`, `box`)
- export interface `ShadowBounds` @42
- export function `fitShadowBounds()` @48: Tightest orthographic box around `points`, seen from a light that looks along -dir at `target` from `distance` (calls: `normalize`, `negate`, `dir.clone`, `crossVectors`, `Vector3`, `sub`, `p.clone`, `rel.dot`, `Math.min`, `Math.max`)
- export function `configureMoonLight()` @64: Puts the moon light where the moon is and sets up its shadow map. The map is drawn once (see the scene), so it can be generous. (calls: `moonDirection`, `addScaledVector`, `light.position.copy`, `light.target.position.copy`, `s.mapSize.set`, `fitShadowBounds`, `shadowFitPoints`, `Object.assign`, `s.camera.updateProjectionMatrix`)

## website/src/scene/shootingstar.test.ts
- const `slot()` @6 (calls: `part.object.getObjectByName`)
- const `uP()` @7 (calls: `slot`)
- const `head()` @8 (calls: `part.object.updateMatrixWorld`, `getWorldPosition`, `slot`, `Vector3`)
- const `STAR` @12

## website/src/scene/shootingstar.ts
- export const `SHOOTING` @5: A shooting star on the star dome: a bright head with a fading tail that flies a short way down the sky.
- const `VERT` @14
- const `FRAG` @16
- const `ease()` @30
- export function `buildShootingStars()` @32 (calls: `Group`, `Array.from`, `ShaderMaterial`, `PlaneGeometry`, `geometry.translate`, `Mesh`, `holder.add`, `group.add`, `Vector3`, `slots.filter`, `slots.find`, `setLength`, `slot.holder.position.copy`, `slot.holder.lookAt`, `slot.holder.updateMatrixWorld`, `rand`, `transformDirection`, `Math.cos`, `Math.sin`, `slot.dir.set`, `slot.streak.position.set`, `Math.max`, `multiplyScalar`, `s.streak.position.copy`, `ease`)

## website/src/scene/sky.test.ts
- const `channels()` @6 (calls: `Color`)
- const `uniforms()` @7

## website/src/scene/sky.ts
- export const `SKY_VIOLET` @6: Where the sky goes when the world turns over or the camera looks up into the stars: a deep violet.
- const `clamp()` @8 (calls: `Math.min`, `Math.max`)
- const `VERT` @10
- const `FRAG` @18
- export function `buildSky()` @34: The night sky: a big inside-out dome shaded from a lighter blue at the horizon to a deep blue overhead. (calls: `Color`, `ShaderMaterial`, `horizon.clone`, `zenith.clone`, `Mesh`, `SphereGeometry`, `Group`, `group.add`, `clamp`, `lerp`, `material.uniforms.uHorizon.value.copy`, `material.uniforms.uZenith.value.copy`)

## website/src/scene/stars.ts
- export const `STARS` @8: Stars on a far dome in front of the camera (the visible sky window, with some margin for parallax). It reaches up to
- const `WHITE` @16
- const `YELLOW` @17
- export function `generateStars()` @19 (calls: `mulberry32`, `rng`, `Float32Array`, `r`, `Math.cos`, `Math.sin`, `colors.set`)
- export function `starPositions()` @40: Where each star is in the world (the same stars the scene draws), for working out which one was clicked. (calls: `generateStars`, `Array.from`, `Vector3`)
- const `VERT` @45
- const `FRAG` @60
- export function `buildStars()` @71 (calls: `Group`, `generateStars`, `BufferGeometry`, `geo.setAttribute`, `Float32BufferAttribute`, `ShaderMaterial`, `Points`, `group.add`, `cappedPixelRatio`)

## website/src/scene/torii.test.ts
- const `gate()` @7 (calls: `buildTorii`, `g.updateMatrixWorld`)

## website/src/scene/torii.ts
- export const `TORII` @9: Dimensions in meters, from the SVG prototype (mockups/landing-hero.html).
- const `KASAGI_HALF` @16
- const `lift()` @17 (calls: `Math.pow`, `Math.abs`)
- function `curvedBeam()` @20: Curved beam silhouette (front view) extruded back along z. (calls: `Shape`, `lift`, `s.moveTo`, `s.lineTo`, `ExtrudeGeometry`, `g.translate`)
- export function `buildTorii()` @36 (calls: `MeshToonMaterial`, `mat`, `Group`, `hillHeight`, `Math.cos`, `Math.sin`, `groundAt`, `Math.max`, `gate.position.set`, `Mesh`, `m.position.set`, `gate.add`, `BoxGeometry`, `forEach`, `CylinderGeometry`, `p.position.set`, `Math.atan`, `foot.position.set`, `part`, `box`, `curvedBeam`)

## website/src/scene/tree.test.ts
- const `first()` @6 (calls: `obj.getObjectByName`, `Array.from`, `m.instanceMatrix.array.slice`)

## website/src/scene/tree.ts
- export const `TREE` @14: Local coordinates: origin at the foot of the trunk, y up, +x to the right on screen. Meters.
- export const `TREE_SCALE` @19: The whole tree is drawn at this scale, and sits 0.2 below the hill surface.
- const `TREE_SINK` @20
- export interface `TreeStats` @22
- const `v()` @28 (calls: `Vector3`)
- export function `taperedTube()` @31: Tube along a bezier whose radius tapers from r0 to r1. (calls: `c.computeFrenetFrames`, `c.getPoint`, `Math.cos`, `Math.sin`, `pos.push`, `idx.push`, `BufferGeometry`, `g.setAttribute`, `Float32BufferAttribute`, `g.setIndex`, `g.computeVertexNormals`)
- const `TRUNK` @56
- export const `BRANCHES` @57
- const `CLOUDS` @67
- export function `treeLocalToWorld()` @73: World position of a point given in the tree's own coordinates (meters, origin at the foot of the trunk). (calls: `Array.isArray`, `Vector3`, `local.clone`, `add`, `p.multiplyScalar`, `hillHeight`)
- export function `branchPointWorld()` @80: A point `t` (0..1) along branch `index`, in world coordinates. (calls: `treeLocalToWorld`, `getPoint`)
- function `flowerGeometry()` @85: Five-lobed flower outline, radius about 1. (calls: `Shape`, `Math.cos`, `s.moveTo`, `Math.sin`, `s.lineTo`, `ShapeGeometry`)
- function `leafGeometry()` @94 (calls: `Shape`, `s.moveTo`, `s.bezierCurveTo`, `ShapeGeometry`)
- export const `BLOSSOM` @101: Where the blossom is, in the tree's own coordinates (the middle of the canopy), and how big it is in meters.
- export function `buildTree()` @103 (calls: `mulberry32`, `rng`, `MeshToonMaterial`, `Group`, `mat`, `tree.add`, `Mesh`, `taperedTube`, `CylinderGeometry`, `shade.position.set`, `BRANCHES.forEach`, `flowerGeometry`, `Matrix4`, `Quaternion`, `Euler`, `Vector3`, `Color`, `CLOUDS.map`, `volume.reduce`, `r`, `InstancedMesh`, `pickCloud`, `inBall`, `p.set`, `e.set`, `q.setFromEuler`, `s.set`, `mesh.setMatrixAt`, `m4.compose`, `mesh.setColorAt`, `col.setHex`, `Math.floor`, `canopy.add`, `layer`, `leafGeometry`, `leafMesh.setMatrixAt`, `createReaction`, `Object3D`, `tree.scale.setScalar`, `o.add`, `o.position.set`, `hillHeight`, `shudder.step`, `Math.sin`, `windGust`, `shudder.kick`)

## website/src/scene/wind.ts
- let `pushed` @1
- export function `windGust()` @5: Wind strength over time, 0 (calm) to 1 (strong gust). Swells come every ten seconds or so; moving the pointer (calls: `Math.sin`, `Math.min`)
- export function `pushWind()` @11: Adds wind (0..1 in total): a quick sweep of the pointer calls this, and it fades by itself (see `decayWind`). (calls: `Math.min`)
- export function `decayWind()` @16: Lets the pushed wind die down; call once per frame with the frame time in seconds. (calls: `Math.exp`, `Math.max`)
- export function `pushedWind()` @22: How much wind the pointer is adding right now (for tests and the readout).

## website/src/scene/windlines.test.ts
- const `lines()` @6
- const `opacity()` @7

## website/src/scene/windlines.ts
- export const `WIND_LINES` @7: Thin flowing streaks that drift from right to left when a gust blows.
- export function `windStreakPoints()` @10: Centre line of one streak: runs left from the origin and rolls gently up and down, never doubling back. (calls: `pts.push`, `Math.sin`, `Math.min`)
- function `ribbon()` @20: A flat ribbon along the centre line, pointed at both ends so it reads as a wisp of air. (calls: `Math.max`, `Math.min`, `Math.hypot`, `Math.pow`, `Math.sin`, `pos.push`, `idx.push`, `BufferGeometry`, `g.setAttribute`, `Float32BufferAttribute`, `g.setIndex`)
- export function `buildWindLines()` @40 (calls: `mulberry32`, `rng`, `Group`, `Array.from`, `ribbon`, `windStreakPoints`, `r`, `Mesh`, `MeshBasicMaterial`, `mesh.position.set`, `mesh.scale.setScalar`, `group.add`, `windGust`, `Math.sin`, `Math.min`, `Math.max`)
