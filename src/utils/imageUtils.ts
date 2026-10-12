import {
  writeFile,
  mkdir,
  exists,
  BaseDirectory,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import Database from "@tauri-apps/plugin-sql";
import { findOrphanImages } from "./noteUtils";

const IMAGES_DIR = "images";

// Save image to AppData/images and return the asset URL
export async function saveImage(blob: Blob): Promise<string> {
  try {
    // 1. Ensure directory exists
    const dirExists = await exists(IMAGES_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      await mkdir(IMAGES_DIR, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });
    }

    // 2. Wrap the blob buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 3. Generate unique filename (UUID)
    // Keep only a safe alphanumeric extension (e.g. "svg+xml" -> "svg")
    const rawExt = (blob.type.split("/")[1] || "png").split("+")[0];
    const ext = /^[a-z0-9]{1,5}$/i.test(rawExt) ? rawExt.toLowerCase() : "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${IMAGES_DIR}/${filename}`;

    // 4. Write file
    await writeFile(filePath, buffer, { baseDir: BaseDirectory.AppData });

    // FIX: Use custom local-image protocol to trigger direct FS read in frontend
    // This bypasses network layer failure on Windows
    const assetUrl = `local-image:${IMAGES_DIR}/${filename}`;

    return assetUrl;
  } catch (err) {
    console.error("❌ FAILED to save image:", err);
    // Return Base64 as fallback so user can still see image
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Garbage Collection: Delete unused images
export async function runGarbageCollection(db: Database) {
  try {
    const notes: { content: string }[] = await db.select(
      "SELECT content FROM notes"
    );

    const dirExists = await exists(IMAGES_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) return;

    const entries = await readDir(IMAGES_DIR, { baseDir: BaseDirectory.AppData });
    const names = entries.filter((f) => f.isFile && f.name).map((f) => f.name);
    const orphans = findOrphanImages(
      names,
      notes.map((n) => n.content ?? "")
    );

    for (const name of orphans) {
      try {
        await remove(`${IMAGES_DIR}/${name}`, {
          baseDir: BaseDirectory.AppData,
        });
      } catch {
        // Ignore (file might be gone already)
      }
    }
  } catch (err) {
    console.error("GC Error:", err);
  }
}
