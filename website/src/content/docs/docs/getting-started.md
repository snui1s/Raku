---
title: Getting started
description: Install Raku, get past the Windows SmartScreen warning, and start writing.
---

Raku is a note-taking app for Windows 10 and 11. There is nothing to sign up for, and your notes stay on your computer.

## Install

1. Download the latest installer from the [home page](/) or from [GitHub Releases](https://github.com/snui1s/Raku/releases/latest). The file is named like `Raku_1.1.1_x64-setup.exe`.
2. Run it and follow the installer.
3. Start Raku from the Start menu.

Raku checks for new versions when it starts. When an update is available, a dialog offers to install it, and you can choose **Later**.

## Windows SmartScreen

The first time you run the installer, Windows may show **"Windows protected your PC"**. This happens because the installer is not signed with a Windows code signing certificate yet. It does not mean the file was flagged as malware.

To continue:

1. Click **More info**.
2. Click **Run anyway**.

Raku is open source, and every release is built from the public repository by the workflow in [`.github/workflows/release.yml`](https://github.com/snui1s/Raku/blob/main/.github/workflows/release.yml). You can read the code or build it yourself.

## Verify your download

Each release includes a `SHA256SUMS` file. To check that your installer matches it, open PowerShell in the folder with the installer and run:

```powershell
Get-FileHash .\Raku_1.1.1_x64-setup.exe -Algorithm SHA256
```

The hash printed should match the line for your installer in `SHA256SUMS`. If it does not, download the file again.

## First launch

- Click **New note** and start typing. Your note saves automatically.
- Press `Ctrl K` to search or jump to a note.
- Open [Settings](/docs/guides/zoom-and-settings/) to change the paper width, line spacing and interface scale.

Next: read the guides on [folders](/docs/guides/folders/), [export and backup](/docs/guides/export-and-backup/), and [where your data is stored](/docs/guides/your-data/).
