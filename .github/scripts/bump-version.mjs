// Usage: node .github/scripts/bump-version.mjs <patch|minor|major|x.y.z> [--dry]
// Keeps package.json, tauri.conf.json, Cargo.toml and Cargo.lock on one version.
// Prints the new version, and writes `version=` / `tag=` to $GITHUB_OUTPUT when set.
import fs from "node:fs";

const [arg, flag] = process.argv.slice(2);
const dry = flag === "--dry";
const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => !dry && fs.writeFileSync(p, s);

const pkgPath = "package.json";
const pkg = JSON.parse(read(pkgPath));

export function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  const m = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) throw new Error(`Current version "${current}" is not x.y.z`);
  let [maj, min, pat] = m.slice(1).map(Number);
  if (bump === "major") [maj, min, pat] = [maj + 1, 0, 0];
  else if (bump === "minor") [min, pat] = [min + 1, 0];
  else if (bump === "patch") pat += 1;
  else throw new Error(`Unknown bump "${bump}" (use patch, minor, major or x.y.z)`);
  return `${maj}.${min}.${pat}`;
}

const version = nextVersion(pkg.version, arg);

// package.json (keep original line endings)
const pkgRaw = read(pkgPath);
write(pkgPath, pkgRaw.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`));

// tauri.conf.json
const confPath = "src-tauri/tauri.conf.json";
const confRaw = read(confPath);
write(confPath, confRaw.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`));

// Cargo.toml: only the [package] version
const tomlPath = "src-tauri/Cargo.toml";
const tomlRaw = read(tomlPath);
write(tomlPath, tomlRaw.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`));

// Cargo.lock: the raku-app entry
const lockPath = "src-tauri/Cargo.lock";
if (fs.existsSync(lockPath)) {
  const lockRaw = read(lockPath);
  write(
    lockPath,
    lockRaw.replace(/(name = "raku-app"\r?\nversion = ")[^"]+(")/, `$1${version}$2`)
  );
}

console.log(version);
if (process.env.GITHUB_OUTPUT && !dry) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ntag=v${version}\n`);
}
