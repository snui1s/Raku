# 楽 Raku

**The Cloud Scratchpad** — A minimal, fast note-taking app that syncs.

> "Smarter than Notepad, simpler than Notion."

**Raku (楽)** means "Ease" or "Comfort". Inspired by the freedom of scribbling (**Rakugaki**), it is designed to let you capture thoughts without friction.

## Features & Roadmap

### Core Experience (Current)

- [x] **Instant Launch** — Lightweight Tauri app (Rust-based)
- [x] **Zen UI** — Dark, distraction-free interface
- [x] **Rich Text** — Tiptap editor with Markdown support
- [x] **Pomodoro Timer** — Built-in focus timer

### Coming Soon (In Development)

- [ ] **Auto-Save** — Never lose your thoughts (Local DB)
- [ ] **AI Ghost Writer** — Integration with Ollama (Local LLM)
- [ ] **Cloud Sync** — Real-time sync across devices
- [ ] **Slash Commands** — Notion-like command menu

## Tech Stack

- **Frontend:** React + TypeScript + TailwindCSS v4
- **Desktop:** Tauri (Rust)
- **Editor:** Tiptap
- **Font:** LINE Seed Sans TH

## Getting Started

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
