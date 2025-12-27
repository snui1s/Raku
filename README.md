# 楽 Raku

**The Cloud Scratchpad** — A minimal, fast note-taking app designed for flow.

> "Smarter than Notepad, simpler than Notion."

**Raku (楽)** means "Ease" or "Comfort". It is designed to let you capture thoughts without friction.

[![Download Raku](https://img.shields.io/badge/Download-Raku_v1.0-F25C54?style=for-the-badge&logo=windows)](https://github.com/YOUR_USERNAME/raku/releases)

_(Click the button above to download the latest `.exe`)_

## ✨ Features (v1.0)

**Raku** comes packed with essential tools for focused writing:

- **📝 Rich Text & Markdown**: Write naturally with Bold, Italic, Headings, and Lists.
- **🎨 Stylish Highlighting**: Highlight text and change colors with a beautiful pastel palette.
- **✅ Task Management**: Interactive checkboxes with "Smart Backspace" logic.
- **🍅 Pomodoro Timer**: Built-in focus timer (25 min) with celebration confetti.
- **🖼️ Image Support**: Drag & drop images directly into your notes (resizeable!).
- **🌗 Day/Night Theme**: Smooth toggle between Light and Dark modes.
- **💾 Auto-Save**: Offline-first architecture using SQLite. Your work is saved instantly.
- **📂 Sidebar Navigation**: Easily manage multiple notes with search/rename capabilities.

## Tech Stack

- **Frontend:** React + TypeScript + TailwindCSS
- **Desktop:** Tauri (Rust)
- **Editor:** Tiptap
- **Database:** SQLite (Local)
- **Font:** LINE Seed Sans TH

## Getting Started (For Developers)

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run Tauri app
bun tauri dev

# Build for production
bun tauri build
```

## Project Structure

```
src/           # React frontend
src-tauri/     # Tauri/Rust backend
public/        # Static assets
```

## License

MIT
