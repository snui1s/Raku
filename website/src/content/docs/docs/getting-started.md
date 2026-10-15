---
title: Getting started
description: Install Raku for Windows and create your first note.
---

Raku is a note-taking app for Windows 10 and 11. There is nothing to sign up for, and your notes stay on your computer.

## Install

1. Download the latest **x64** installer from the [home page](/) or from [GitHub Releases](https://github.com/snui1s/Raku/releases/latest). The file is named like `Raku_1.1.1_x64-setup.exe`; the version number changes between releases.
2. Run it and follow the installer.
3. Start Raku from the Start menu.

If Windows shows a warning, follow the [SmartScreen steps below](#windows-smartscreen).

## Create your first note

1. Use the empty note Raku opens for you, or click **New note** in the sidebar.
2. Type a title on the first line, then add your text below it. Raku uses the first line as the note's title.
3. Select some text and use the toolbar above the note to make it bold, add a heading or highlight it.
4. Stop typing for a moment. Raku saves automatically, after two seconds by default.

Press `Ctrl` + `K` to find a note by its title. Open **Settings** from the gear button in the header to adjust the paper width, line spacing and interface size.

Next: learn about [writing and images](/docs/guides/writing-and-images/), [organizing notes](/docs/guides/folders/) and [making a backup](/docs/guides/export-and-backup/).

## Updates

Raku checks for new versions when it starts. When an update is available, choose **Update now** to download and install it, or **Later** to keep writing. See [Troubleshooting](/docs/guides/troubleshooting/#an-update-is-unavailable-or-fails) if an update does not work.

## Windows SmartScreen

Windows may show **"Windows protected your PC"** for an unfamiliar download. The warning by itself does not establish whether the file has a valid publisher signature.

If you downloaded the installer from the official release and have checked that it is the file you intended to run:

1. Click **More info**.
2. Click **Run anyway**.

If your PC is managed by an organization, its policy may prevent continuing. See [Troubleshooting](/docs/guides/troubleshooting/#windows-shows-a-warning-during-installation) for reporting a different installation error.

Raku is open source. The release build workflow is in [`.github/workflows/release.yml`](https://github.com/snui1s/Raku/blob/main/.github/workflows/release.yml).

## Verify your download

Each release includes a `SHA256SUMS` file. To check that your installer matches it, open PowerShell in the folder with the installer and run:

```powershell
Get-FileHash .\Raku_1.1.1_x64-setup.exe -Algorithm SHA256
```

Replace the example filename with the installer you downloaded. The hash should match the line for that filename in `SHA256SUMS`. If it does not, download the file again.

The release's `.sig` file is used by Raku's updater. It is separate from the Windows publisher signature. To inspect the latter, right-click the installer in File Explorer and open **Properties → Digital Signatures**, if that tab is present.

For help after installation, use [Troubleshooting and FAQ](/docs/guides/troubleshooting/) or browse [all guides](/docs/).
