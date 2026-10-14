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
- interface `UpdateModalProps` @1
- export function `UpdateModal()` @12 (calls: `setUpdateAvailable`)

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
- export const `findOrphanImages()` @37 (calls: `noteContents.join`, `fileNames.filter`, `all.includes`)

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
