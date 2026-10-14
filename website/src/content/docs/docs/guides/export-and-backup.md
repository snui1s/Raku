---
title: Export and backup
description: Export a note to Markdown or PDF, and back up or restore all of your notes.
---

Open the **Export & Backup** menu from the header.

## Export a note

- **Markdown** saves the current note to your Downloads folder as a `.md` file. If the note contains images, you get a `.zip` with the note and an `images` folder instead.
- **PDF** saves the current note to your Downloads folder as a `.pdf` file.

## Back up everything

**Backup** creates a file named like `raku-backup-<date>.zip` containing all of your notes, folders and images. Keep it somewhere safe, such as a cloud drive or an external disk.

## Restore

**Restore** reads a backup zip and **adds** its contents to what you have now:

- Notes and folders in the backup that you do not have are added.
- A note that exists in both is overwritten with the version from the backup.
- Nothing in your current notes is deleted.

Raku asks you to confirm before restoring.

:::tip
Make a backup before reinstalling Windows or moving to a new computer, then restore it on the new machine.
:::
