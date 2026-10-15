---
title: Export and backup
description: Export a note to Markdown or PDF, and back up or restore all of your notes.
---

Open the **Export & Backup** menu from the header.

## Export a note

- **Markdown** saves the current note to your Downloads folder as a `.md` file. If the note contains images, you get a `.zip` with the note and an `images` folder instead.
- **PDF** saves a basic text PDF to your Downloads folder. Read the limitations below before using it for a long or formatted note.

### PDF limitations

The current PDF export produces a **single-page text file**. It does not preserve images or rich text styling, non-Latin characters may not render correctly, and long notes can be cut off.

Use **Markdown** to keep a note's text and images together. A **Backup** is the format to use when restoring notes into Raku.

## Back up everything

**Backup** creates a file named like `raku-backup-<date>.zip` containing all of your notes, folders and images. Keep it somewhere safe, such as a cloud drive or an external disk.

Appearance preferences and other app settings are not included in the backup.

## Restore

**Restore** reads a backup zip and **adds** its contents to what you have now:

- Notes and folders in the backup that you do not have are added.
- A note that exists in both is overwritten with the version from the backup.
- Nothing in your current notes is deleted.

Raku asks you to confirm before restoring.

:::tip
Make a backup before reinstalling Windows or moving to a new computer, then restore it on the new machine.
:::
