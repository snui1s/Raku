import {
  writeFile,
  mkdir,
  exists,
  BaseDirectory,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import Database from "@tauri-apps/plugin-sql";

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
    const ext = blob.type.split("/")[1] || "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${IMAGES_DIR}/${filename}`;

    // 4. Write file
    await writeFile(filePath, buffer, { baseDir: BaseDirectory.AppData });

    // 5. Get absolute path to convert to asset URL
    // We use a custom rust command or just construct it if we know the path.
    // Better: getting the absolute path via the FS API might be tricky without a resolve.
    // Let's rely on the fact that we can construct asset urls if we know the absolute path.
    // Or simpler: Request the absolute path from Rust.

    const absoluteImagesDir = await invoke<string>("get_images_dir");
    // On Windows join might use backslashes, convertFileSrc handles them
    const absolutePath = await join(absoluteImagesDir, filename);

    return convertFileSrc(absolutePath);
  } catch (err) {
    console.error(
      "Failed to save image natively, falling back to Base64:",
      err
    );
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
  console.log("🧹 Running Image Garbage Collection...");
  try {
    // 1. Get all notes content
    const notes: { content: string }[] = await db.select(
      "SELECT content FROM notes"
    );

    // 2. Extract all used image filenames
    // Regex to match our filenames (assumes uuid structure)
    // Asset URL format: https://asset.localhost/.../uuid.png
    // We just look for the filename pattern in the JSON string
    const usedFilenames = new Set<string>();
    const regex = /[a-f0-9\-]{36}\.(png|jpg|jpeg|gif|webp)/gi;

    notes.forEach((note) => {
      const matches = note.content.match(regex);
      if (matches) {
        matches.forEach((m) => usedFilenames.add(m));
      }
    });

    // 3. List actual files
    const dirExists = await exists(IMAGES_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) return;

    const files = await readDir(IMAGES_DIR, { baseDir: BaseDirectory.AppData });

    // 4. Delete orphans
    let deletedCount = 0;
    for (const file of files) {
      if (file.isFile && file.name) {
        if (!usedFilenames.has(file.name)) {
          // This file is NOT in any note -> Delete it
          await remove(`${IMAGES_DIR}/${file.name}`, {
            baseDir: BaseDirectory.AppData,
          });
          deletedCount++;
          console.log(`🗑️ GC Deleted orphan: ${file.name}`);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`✨ GC Finished: Cleaned ${deletedCount} images.`);
    } else {
      console.log("✨ GC Finished: No orphans found.");
    }
  } catch (err) {
    console.error("GC Error:", err);
  }
}
