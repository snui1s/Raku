import {
  writeFile,
  mkdir,
  exists,
  BaseDirectory,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import Database from "@tauri-apps/plugin-sql";

const IMAGES_DIR = "images";

// Save image to AppData/images and return the asset URL
export async function saveImage(blob: Blob): Promise<string> {
  try {
    // 1. Ensure directory exists
    console.log("Creating/Checking directory...");
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
    console.log("Processing blob...");
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 3. Generate unique filename (UUID)
    const ext = blob.type.split("/")[1] || "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${IMAGES_DIR}/${filename}`;

    // 4. Write file
    console.log("Writing file to:", filePath);
    await writeFile(filePath, buffer, { baseDir: BaseDirectory.AppData });

    // 5. Get absolute path
    console.log("Getting absolute path...");
    const absoluteImagesDir = await invoke<string>("get_images_dir");
    const absolutePath = await join(absoluteImagesDir, filename);
    console.log("Absolute path:", absolutePath);

    // FIX: Use custom local-image protocol to trigger direct FS read in frontend
    // This bypasses network layer failure on Windows
    const assetUrl = `local-image:${IMAGES_DIR}/${filename}`;
    console.log("Generated Local ID:", assetUrl);

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
          try {
            await remove(`${IMAGES_DIR}/${file.name}`, {
              baseDir: BaseDirectory.AppData,
            });
            deletedCount++;
            console.log(`🗑️ GC Deleted orphan: ${file.name}`);
          } catch (e) {
            // Ignore (file might be gone already)
          }
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
