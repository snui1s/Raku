import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Helper to bump semver (major.minor.patch)
function bumpSemver(currentVersion: string, type: string = "patch"): string {
  const parts = currentVersion.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver version: ${currentVersion}`);
  }

  let [major, minor, patch] = parts;

  // If explicit version is passed (e.g. "1.0.4")
  if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type;
  }

  switch (type.toLowerCase()) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
    default:
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

function runBump() {
  const arg = process.argv[2] || "patch";
  const projectRoot = process.cwd();

  const packageJsonPath = join(projectRoot, "package.json");
  const tauriConfPath = join(projectRoot, "src-tauri", "tauri.conf.json");
  const cargoTomlPath = join(projectRoot, "src-tauri", "Cargo.toml");

  // 1. Read package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const oldVersion = packageJson.version || "1.0.0";
  const newVersion = bumpSemver(oldVersion, arg);

  console.log(`\x1b[36m🚀 Raku Version Bumper\x1b[0m`);
  console.log(`Bumping version: \x1b[33m${oldVersion}\x1b[0m ➔ \x1b[32m${newVersion}\x1b[0m (${arg})\n`);

  // 2. Update package.json
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  console.log(`\x1b[32m✔\x1b[0m Updated package.json`);

  // 3. Update tauri.conf.json
  try {
    const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf-8"));
    tauriConf.version = newVersion;
    writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 4) + "\n");
    console.log(`\x1b[32m✔\x1b[0m Updated src-tauri/tauri.conf.json`);
  } catch (err) {
    console.warn(`\x1b[33m⚠\x1b[0m Could not update tauri.conf.json:`, err);
  }

  // 4. Update Cargo.toml
  try {
    let cargoToml = readFileSync(cargoTomlPath, "utf-8");
    cargoToml = cargoToml.replace(
      /^version\s*=\s*"[^"]+"/m,
      `version = "${newVersion}"`
    );
    writeFileSync(cargoTomlPath, cargoToml);
    console.log(`\x1b[32m✔\x1b[0m Updated src-tauri/Cargo.toml`);
  } catch (err) {
    console.warn(`\x1b[33m⚠\x1b[0m Could not update Cargo.toml:`, err);
  }

  // 5. Git Commit, Tag & Push with --follow-tags automatically
  try {
    const commitMsg = `chore(release): bump version to v${newVersion}`;
    execSync(`git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`, { stdio: "ignore" });
    execSync(`git commit -m "${commitMsg}"`, { stdio: "ignore" });
    execSync(`git tag v${newVersion}`, { stdio: "ignore" });
    console.log(`\x1b[32m✔\x1b[0m Git commit & tag created: v${newVersion}`);

    console.log(`\x1b[36m📤 Pushing to remote with --follow-tags...\x1b[0m`);
    try {
      execSync(`git push --follow-tags`, { stdio: "inherit" });
    } catch {
      const branch = execSync(`git rev-parse --abbrev-ref HEAD`, { encoding: "utf-8" }).trim();
      execSync(`git push -u origin ${branch} --follow-tags`, { stdio: "inherit" });
    }
    console.log(`\x1b[32m✔\x1b[0m Git pushed with --follow-tags successfully`);
  } catch (err) {
    console.warn(`\x1b[33m⚠\x1b[0m Git commit/push skipped or failed (you can push manually)`);
  }

  console.log(`\n\x1b[32m🎉 Success! Version bumped to v${newVersion}\x1b[0m\n`);
}

runBump();
