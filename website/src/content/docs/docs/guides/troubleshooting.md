---
title: Troubleshooting and FAQ
description: Help with installation, saving, images, offline fonts, exports and updates in Raku.
---

## Windows shows a warning during installation

See [Windows SmartScreen](/docs/getting-started/#windows-smartscreen) and [Verify your download](/docs/getting-started/#verify-your-download). Download the installer from the Raku home page or the official GitHub release.

If Windows blocks installation with a different message, record the exact text when [reporting the problem](#report-a-bug).

## Raku cannot open my notes

If you see **Raku couldn't open your notes**, copy the error details shown on screen and try restarting Raku.

If it keeps happening, close the app and make a copy of your [data folder](/docs/guides/your-data/#location) before changing or replacing files. Include the error text in a bug report. Your notes may still be present even if the app cannot open them.

## A note will not save

If Raku shows **Could not save note**:

1. Keep the app open and copy your current text into another file.
2. Check that the disk containing your Windows user profile has free space and that the [data folder](/docs/guides/your-data/#location) is accessible.
3. After preserving the text, restart Raku and reopen the note.
4. If the error returns, report the message and the steps that led to it.

For normal saving, Raku waits **1, 2 or 5 seconds** after you stop typing, depending on **Settings → Writing → Auto-save after**.

## An image is missing

- Open the original note in Raku. When pasting or dropping an image, wait for it to appear in the editor.
- If you moved your data manually, include the **images** folder as well as **raku.db**.
- When sharing an exported Markdown note, keep its **images** folder next to the `.md` file after extracting the ZIP.
- If the image is missing only from a PDF, read the [PDF limitations](/docs/guides/export-and-backup/#pdf-limitations).

See [Writing and images](/docs/guides/writing-and-images/#add-an-image) for adding and resizing images.

## A font looks different or does not load

**LINE Seed** is bundled with Raku. Other choices may load from Google Fonts or jsDelivr and can fall back to another typeface when the computer is offline or those services are blocked.

Choose **LINE Seed** in the toolbar for a bundled font, or reconnect and reopen the note to try the online font again.

## Search does not find text inside a note

Raku's command palette searches **note titles**, with up to eight matching notes shown. It does not search the full text of notes. Try a word from the title, or rename the note to make it easier to find.

See [Search and commands](/docs/guides/search/).

## The toolbar, sidebar or header disappeared

- Press `Ctrl` + `Shift` + `T` to toggle the toolbar.
- Press `Esc` to leave Zen mode and bring back the header and sidebar.
- If you hid only the sidebar, use the sidebar toggle at the top left of the app.

## A PDF is missing content or formatting

The current PDF export is a basic, single-page text export. Images, rich formatting and non-Latin characters may not be preserved, and long notes can be cut off.

For a complete copy of a note's text and images, use **Markdown** and keep the resulting ZIP together. To move notes back into Raku, use **Backup**. See [Export and backup](/docs/guides/export-and-backup/).

## An update is unavailable or fails

Raku checks for updates when it starts. It needs an internet connection to reach GitHub. After checking your connection, close and reopen the app to try again.

You can also download the latest installer from [GitHub Releases](https://github.com/snui1s/Raku/releases/latest). Make a [backup](/docs/guides/export-and-backup/#back-up-everything) before reinstalling or moving your data.

If you choose **Later**, you can keep writing and check again on a later launch.

## Can I recover a deleted note?

There is no trash or undo for deleting a note. If you have an earlier Raku backup, [restore it](/docs/guides/export-and-backup/#restore). Existing notes with the same IDs are replaced by the versions in the backup, so make a backup of your current work first.

Deleting a **folder** is different: its notes move to the Inbox.

## Does Raku sync between computers?

Notes are stored locally. To move them to another computer, create a backup on the first computer and restore that ZIP in Raku on the second one. See [Export and backup](/docs/guides/export-and-backup/).

## Report a bug

Open an issue in the [Raku GitHub repository](https://github.com/snui1s/Raku/issues) and include:

- Your **Raku version**, shown at the bottom of Settings.
- Your **Windows version**.
- What you did, what you expected, and what happened instead.
- The exact error message, plus a screenshot if it helps.

Remove private note text from screenshots and error reports before sharing them. A minimal example is usually enough; you do not need to attach your entire database or backup.

Check [release notes](https://github.com/snui1s/Raku/releases) to see whether a newer version addresses the problem.
