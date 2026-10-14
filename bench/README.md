# Benchmarks

Two kinds of measurement. Numbers depend on the machine, so always quote the CPU and RAM with them.

## 1. Logic and database (`bun run bench`)

Runs on any machine, no app needed. It generates 1,000 and 10,000 realistic notes (Thai and English
text, headings, lists, images) and times what Raku does over *all* notes: parsing, titles, search,
sidebar grouping, the image cleanup scan and indicative SQLite queries (same engine as the app, Node
bindings instead of sqlx). It does not include drawing the UI.

Reference run: Intel Core Ultra 7 258V, 32 GB RAM, Node 24.

| Task | 1,000 notes | 10,000 notes |
|---|---:|---:|
| Search titles | 0.05 ms | 0.6 ms |
| Sidebar sort + group | 0.04 ms | 0.7 ms |
| Parse every note's JSON | 4 ms | 43 ms |
| Image cleanup scan (runs in the background at startup) | 31 ms | 385 ms |
| SQLite: load all notes at startup | 51 ms | 314 ms |
| SQLite: save one note (auto-save) | < 0.01 ms | < 0.01 ms |

Things this found:
- The image cleanup scan was quadratic (one search through all note text per image file): 2.4 s at
  10,000 notes. It now reads every note once (about 6x faster at that size).
- The app loads the full content of every note at startup, so startup time grows with the amount of
  text. Loading content only when a note is opened would flatten this; not done yet.

`src/utils/performance.test.ts` keeps generous guards on these so a slow change fails CI.

## 2. Startup and memory (`bench/startup.ps1`, Windows)

Launches the installed app repeatedly and reports time until the window appears, time until the app
settles (CPU idle, a good proxy for ready to type) and idle memory of all processes including WebView2.

```powershell
powershell -ExecutionPolicy Bypass -File bench/startup.ps1
powershell -ExecutionPolicy Bypass -File bench/startup.ps1 -Runs 15 -Exe "C:\path\to\raku-app.exe"
```

Close Raku first. The app opens with your normal notes and nothing is modified. The first run is
discarded as a warm-up. The script itself was checked with a stand-in Windows app; run it against Raku
on your machine and add your numbers to the project README.
