import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 1. Check for Private Key
// Load .env manually since we are in a simple script
let privateKey = process.env.TAURI_SIGNING_PRIVATE_KEY;
let privateKeyPassword = process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || "";
if (!privateKey && fs.existsSync(".env")) {
  const envConfig = fs.readFileSync(".env", "utf-8");
  const keyMatch = envConfig.match(/TAURI_SIGNING_PRIVATE_KEY="(.+)"/);
  const passMatch = envConfig.match(
    /TAURI_SIGNING_PRIVATE_KEY_PASSWORD="(.*)"/
  );
  if (keyMatch) {
    privateKey = keyMatch[1];
  }
  if (passMatch) {
    privateKeyPassword = passMatch[1];
  }
}

if (!privateKey) {
  console.error(
    "❌ Error: TAURI_SIGNING_PRIVATE_KEY not found in environment or .env file."
  );
  process.exit(1);
}

// 2. Read Version from package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const version = packageJson.version;
console.log(`🚀 Preparing release for version: ${version}`);

// 2.5 Sync version to tauri.conf.json
const tauriConfPath = path.join("src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
if (tauriConf.version !== version) {
  console.log(
    `📝 Syncing tauri.conf.json version from ${tauriConf.version} to ${version}`
  );
  tauriConf.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));
}

// 3. Build & Sign
console.log("🔨 Building application...");
console.log(
  `🔑 Private Key loaded: ${
    privateKey ? "Yes (" + privateKey.substring(0, 30) + "...)" : "No"
  }`
);
console.log(`🔐 Password loaded: ${privateKeyPassword ? "Yes" : "No (empty)"}`);

try {
  // Pass env vars explicitly - use shell: true for Windows compatibility
  execSync("bun tauri build", {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      TAURI_SIGNING_PRIVATE_KEY: privateKey,
      TAURI_SIGNING_PRIVATE_KEY_PASSWORD: privateKeyPassword,
    },
  });
} catch (e) {
  console.error("❌ Build failed.");
  process.exit(1);
}

// 4. Find Signature
const sigPath = path.join(
  "src-tauri",
  "target",
  "release",
  "bundle",
  "nsis",
  `Raku_${version}_x64-setup.exe.sig`
);
if (!fs.existsSync(sigPath)) {
  console.error(`❌ Signature file not found at: ${sigPath}`);
  console.error("Make sure the build completed successfully.");
  process.exit(1);
}

const signature = fs.readFileSync(sigPath, "utf-8");
console.log("✅ Signature found and read.");

// 5. Generate update.json
const updateData = {
  version: version,
  notes: `Release v${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: signature,
      url: `https://github.com/snui1s/raku/releases/download/v${version}/Raku_${version}_x64-setup.exe`,
    },
  },
};

fs.writeFileSync("update.json", JSON.stringify(updateData, null, 2));
console.log("✨ update.json generated successfully!");
console.log("---------------------------------------------------");
console.log("🎉 DONE! Next steps:");
console.log("1. Push 'update.json' to GitHub.");
console.log("2. Upload the .exe and .sig files to GitHub Releases.");
