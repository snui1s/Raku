interface UpdateModalProps {
  updateAvailable: {
    version: string;
    notes: string;
    downloadAndInstall: () => Promise<void>;
  } | null;
  setUpdateAvailable: (value: null) => void;
  isUpdating: boolean;
  isDark?: boolean;
}

export function UpdateModal({
  updateAvailable,
  setUpdateAvailable,
  isUpdating,
}: UpdateModalProps) {
  if (!updateAvailable) return null;

  // update.json carries "Release vX.Y.Z" when there are no real notes, which only repeats the version above
  const notes = /^Release v?[\d.]+$/i.test(updateAvailable.notes.trim()) ? "" : updateAvailable.notes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Update available"
      className="raku-fade fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="raku-pop mx-4 w-full max-w-sm rounded-2xl border border-app-border bg-app-dropdown p-6 text-app-text shadow-2xl">
        <h2 className="text-base font-semibold">Update available</h2>
        <p className="mt-1 text-sm text-app-muted">
          Raku {updateAvailable.version} is ready to install.
        </p>

        {notes && (
          <p className="mt-3 max-h-32 overflow-y-auto whitespace-pre-line text-xs leading-relaxed text-app-muted">
            {notes}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setUpdateAvailable(null)}
            disabled={isUpdating}
            className="flex-1 cursor-pointer rounded-lg bg-app-tertiary px-4 py-2 text-sm font-medium text-app-muted transition-colors hover:text-app-text disabled:opacity-50"
          >
            Later
          </button>
          <button
            onClick={updateAvailable.downloadAndInstall}
            disabled={isUpdating}
            className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isUpdating ? "Updating…" : "Update now"}
          </button>
        </div>
      </div>
    </div>
  );
}
