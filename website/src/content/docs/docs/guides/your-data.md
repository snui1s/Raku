---
title: Where your data is stored
description: Where Raku keeps your notes and images, and how to copy them by hand.
---

Raku keeps everything on your computer. There is no account and no cloud copy.

## Location

Notes and folders are stored in a SQLite database called `raku.db`. Pasted and dropped images are stored in an `images` folder next to it. Both live in the app data folder, which on Windows is usually:

```text
%APPDATA%\com.snails.raku-app\
```

Paste that path into the File Explorer address bar to open it.

## Back up by hand

The built-in [Backup](/docs/guides/export-and-backup/) is the easiest way. To copy your data manually:

1. Close Raku, so the database is not being written to.
2. Copy `raku.db` and the `images` folder from the folder above to a safe place.

To restore by hand, close Raku and copy them back into the same folder.

## Network use

Raku makes these network requests, and no others:

- Checking `update.json` on GitHub for a new version. An update is downloaded only when you accept it.
- Loading web fonts from Google Fonts and jsDelivr when you are online and use a font that is not bundled with the app.

See the [privacy policy](/privacy/) for details.
