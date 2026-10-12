import { useRef, useState } from "react";
import { DatabaseBackup, Upload } from "lucide-react";
import { createBackup, restoreBackup } from "../services/backup";

export function BackupControls() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleBackup = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { blob, filename } = await createBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("Backup saved to Downloads");
    } catch (err) {
      console.error("Backup failed:", err);
      setMessage("Backup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (file: File) => {
    if (
      !window.confirm(
        "Restore from this backup? Notes in the backup are added to your current notes (same notes are overwritten). Nothing is deleted."
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const count = await restoreBackup(file);
      setMessage(`Restored ${count} notes`);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error("Restore failed:", err);
      setMessage(err instanceof Error ? err.message : "Restore failed");
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pt-2 space-y-1">
      <div className="flex gap-2">
        <button
          onClick={handleBackup}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-app-muted hover:text-accent hover:bg-app-tertiary disabled:opacity-50 transition-colors cursor-pointer"
          title="Save all notes and images to a .zip"
        >
          <DatabaseBackup size={13} /> Backup
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-app-muted hover:text-accent hover:bg-app-tertiary disabled:opacity-50 transition-colors cursor-pointer"
          title="Restore notes from a Raku backup .zip"
        >
          <Upload size={13} /> Restore
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) handleRestore(f);
          }}
        />
      </div>
      {message && (
        <p className="text-[10px] text-center text-app-muted">{message}</p>
      )}
    </div>
  );
}
