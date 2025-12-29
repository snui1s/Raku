interface UpdateModalProps {
  updateAvailable: {
    version: string;
    notes: string;
    downloadAndInstall: () => Promise<void>;
  } | null;
  setUpdateAvailable: (value: null) => void;
  isUpdating: boolean;
  isDark: boolean;
}

export function UpdateModal({
  updateAvailable,
  setUpdateAvailable,
  isUpdating,
  isDark,
}: UpdateModalProps) {
  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 ${
          isDark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
        }`}
      >
        <h2 className="text-lg font-bold mb-2">🎉 มีอัพเดทใหม่!</h2>
        <p className="text-sm opacity-70 mb-4">
          เวอร์ชั่น {updateAvailable.version} พร้อมให้ดาวน์โหลดแล้ว
        </p>
        <p className="text-xs opacity-50 mb-4">{updateAvailable.notes}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setUpdateAvailable(null)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-neutral-800 hover:bg-neutral-700"
                : "bg-neutral-100 hover:bg-neutral-200"
            }`}
          >
            ไว้ทีหลัง
          </button>
          <button
            onClick={updateAvailable.downloadAndInstall}
            disabled={isUpdating}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-[#F25C54] text-white hover:bg-[#e04a42] transition-colors disabled:opacity-50"
          >
            {isUpdating ? "กำลังอัพเดท..." : "อัพเดทเลย"}
          </button>
        </div>
      </div>
    </div>
  );
}
