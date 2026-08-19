import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// 1. Helper to read .env
function getEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env as Record<string, string> };
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

async function runRelease() {
  const env = getEnv();
  const privateKey = env.TAURI_SIGNING_PRIVATE_KEY;
  const privateKeyPassword = env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || "";
  const githubToken = env.GITHUB_TOKEN;

  console.log("\x1b[36m🚀 Raku Release & Deploy Pipeline\x1b[0m\n");

  if (!privateKey) {
    console.error("\x1b[31m❌ Error: TAURI_SIGNING_PRIVATE_KEY not found in .env\x1b[0m");
    process.exit(1);
  }

  // 2. Read package.json version
  const projectRoot = process.cwd();
  const packageJsonPath = join(projectRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;
  const tagName = `v${version}`;
  const repoOwner = "snui1s";
  const repoName = "raku";

  console.log(`📦 Release Version: \x1b[32mv${version}\x1b[0m`);
  console.log(`🔑 Tauri Signing Key: \x1b[32mLoaded\x1b[0m`);
  console.log(`🌐 GitHub Token: ${githubToken ? "\x1b[32mLoaded\x1b[0m" : "\x1b[33mNot found (will skip GitHub release upload)\x1b[0m"}\n`);

  // 3. Sync version to tauri.conf.json
  const tauriConfPath = join(projectRoot, "src-tauri", "tauri.conf.json");
  if (existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf-8"));
    if (tauriConf.version !== version) {
      tauriConf.version = version;
      writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
      console.log(`\x1b[32m✔\x1b[0m Synced version in tauri.conf.json`);
    }
  }

  // 4. Build application
  console.log("\x1b[36m🔨 Step 1: Building Tauri application...\x1b[0m");
  try {
    execSync("bun tauri build", { stdio: "inherit" });
  } catch (err) {
    console.error("\x1b[31m❌ Build failed\x1b[0m");
    process.exit(1);
  }

  // 5. Sign the exe file
  const exeName = `Raku_${version}_x64-setup.exe`;
  const exePath = join(projectRoot, "src-tauri", "target", "release", "bundle", "nsis", exeName);

  if (!existsSync(exePath)) {
    console.error(`\x1b[31m❌ Executable not found at: ${exePath}\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n\x1b[36m🔐 Step 2: Signing ${exeName}...\x1b[0m`);
  try {
    execSync(`bun tauri signer sign --private-key "${privateKey}" --password "${privateKeyPassword}" "${exePath}"`, {
      stdio: "inherit",
    });
    console.log(`\x1b[32m✔\x1b[0m Signed successfully!`);
  } catch (err) {
    console.error("\x1b[31m❌ Signing failed\x1b[0m");
    process.exit(1);
  }

  // 6. Verify signature & generate update.json
  const sigPath = `${exePath}.sig`;
  if (!existsSync(sigPath)) {
    console.error(`\x1b[31m❌ Signature file not found at: ${sigPath}\x1b[0m`);
    process.exit(1);
  }

  const signature = readFileSync(sigPath, "utf-8").trim();
  const updateData = {
    version: version,
    notes: `Release v${version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: signature,
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/${tagName}/${exeName}`,
      },
    },
  };

  const updateJsonPath = join(projectRoot, "update.json");
  writeFileSync(updateJsonPath, JSON.stringify(updateData, null, 2) + "\n");
  console.log(`\x1b[32m✔\x1b[0m Generated update.json`);

  // 7. Commit & Push update.json
  console.log(`\n\x1b[36m📤 Step 3: Pushing update.json to GitHub...\x1b[0m`);
  try {
    execSync("git add update.json", { stdio: "ignore" });
    try {
      execSync(`git commit -m "chore(release): update update.json for ${tagName}"`, { stdio: "ignore" });
    } catch {
      // Nothing new to commit
    }
    execSync("git push", { stdio: "inherit" });
    console.log(`\x1b[32m✔\x1b[0m Pushed to repository`);
  } catch (err) {
    console.warn(`\x1b[33m⚠\x1b[0m Could not push to git directly: ${err}`);
  }

  // 8. Upload to GitHub Releases
  if (!githubToken) {
    console.log("\n\x1b[33m⚠ GITHUB_TOKEN not found in .env. Skipping GitHub Release upload.\x1b[0m");
    console.log("👉 Please manually upload the following files to GitHub Releases:");
    console.log(`   - ${exePath}`);
    console.log(`   - ${sigPath}`);
    return;
  }

  console.log(`\n\x1b[36m🚀 Step 4: Creating GitHub Release & Uploading Assets...\x1b[0m`);

  const headers = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "Raku-Release-Script",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    // Check if release exists
    let releaseData: any = null;
    const getRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases/tags/${tagName}`,
      { headers }
    );

    if (getRes.ok) {
      releaseData = await getRes.json();
      console.log(`\x1b[32m✔\x1b[0m Found existing release for ${tagName} (ID: ${releaseData.id})`);
    } else {
      // Create release
      const createRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/releases`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tag_name: tagName,
            name: `${tagName}`,
            body: `Release ${tagName}`,
            draft: false,
            prerelease: false,
          }),
        }
      );

      if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Failed to create GitHub release: ${createRes.status} ${errorText}`);
      }

      releaseData = await createRes.json();
      console.log(`\x1b[32m✔\x1b[0m Created GitHub release for ${tagName} (ID: ${releaseData.id})`);
    }

    // Helper to upload an asset
    async function uploadAsset(filePath: string, fileName: string, contentType: string) {
      // Delete existing asset if it exists
      if (releaseData.assets && Array.isArray(releaseData.assets)) {
        const existingAsset = releaseData.assets.find((a: any) => a.name === fileName);
        if (existingAsset) {
          console.log(`🗑 Deleting existing asset: ${fileName}...`);
          await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/releases/assets/${existingAsset.id}`,
            { method: "DELETE", headers }
          );
        }
      }

      console.log(`⬆ Uploading \x1b[33m${fileName}\x1b[0m...`);
      const fileBuffer = readFileSync(filePath);
      const uploadUrl = `https://uploads.github.com/repos/${repoOwner}/${repoName}/releases/${releaseData.id}/assets?name=${encodeURIComponent(fileName)}`;

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": contentType,
          "Content-Length": fileBuffer.length.toString(),
        },
        body: fileBuffer,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Failed to upload ${fileName}: ${uploadRes.status} ${errText}`);
      }

      console.log(`\x1b[32m✔\x1b[0m Uploaded ${fileName} successfully!`);
    }

    // Upload .exe and .sig
    await uploadAsset(exePath, exeName, "application/octet-stream");
    await uploadAsset(sigPath, `${exeName}.sig`, "text/plain");

    console.log("\n\x1b[32m🎉 RELEASE COMPLETE! 🎉\x1b[0m");
    console.log(`🔗 Release URL: \x1b[34mhttps://github.com/${repoOwner}/${repoName}/releases/tag/${tagName}\x1b[0m\n`);
  } catch (err: any) {
    console.error(`\x1b[31m❌ GitHub Release failed:\x1b[0m`, err?.message || err);
    process.exit(1);
  }
}

runRelease();
