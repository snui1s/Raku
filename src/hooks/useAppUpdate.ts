import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState<{
    version: string;
    notes: string;
    downloadAndInstall: () => Promise<void>;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update?.available) {
          setUpdateAvailable({
            version: update.version,
            notes: update.body || "New version available!",
            downloadAndInstall: async () => {
              setIsUpdating(true);
              await update.downloadAndInstall();
              // App will restart automatically after install
            },
          });
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    };
    checkForUpdates();
  }, []);

  return {
    updateAvailable,
    isUpdating,
    setUpdateAvailable,
  };
}
