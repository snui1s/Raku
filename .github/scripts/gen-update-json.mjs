// Usage: node .github/scripts/gen-update-json.mjs <version> <installer.exe> <repo owner/name> [notes]
// Writes update.json in the format the Tauri updater (see tauri.conf.json endpoints) reads.
import fs from "node:fs";
import path from "node:path";

const [version, exePath, repo, notes] = process.argv.slice(2);
if (!version || !exePath || !repo) {
  console.error("usage: gen-update-json.mjs <version> <installer.exe> <owner/repo> [notes]");
  process.exit(1);
}

const sigPath = `${exePath}.sig`;
if (!fs.existsSync(sigPath)) {
  console.error(`Signature not found: ${sigPath}`);
  process.exit(1);
}

const update = {
  version,
  notes: notes || `Release v${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: fs.readFileSync(sigPath, "utf8").trim(),
      url: `https://github.com/${repo}/releases/download/v${version}/${path.basename(exePath)}`,
    },
  },
};

fs.writeFileSync("update.json", JSON.stringify(update, null, 2) + "\n");
console.log(`update.json written for v${version}`);
