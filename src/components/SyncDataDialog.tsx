import { useState, useEffect, useCallback, useRef } from "react";
import { readDir, copyFile, exists } from "@tauri-apps/plugin-fs";

const SRC_DIR = "G:\\My Drive\\WOM\\WON\\PvPData\\playerdata";
const DEST_DIR = "D:\\WheelOfMultiverseRE\\wheelofname\\public\\data";

interface SyncLog {
  file: string;
  status: "ok" | "error";
  message?: string;
}

interface SyncDataDialogProps {
  onClose: () => void;
}

export function SyncDataDialog({ onClose }: SyncDataDialogProps) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const startedRef = useRef(false);

  const addLog = useCallback((log: SyncLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const runSync = useCallback(async () => {
    setRunning(true);
    setLogs([]);
    setDone(0);
    setFinished(false);

    try {
      const srcExists = await exists(SRC_DIR);
      if (!srcExists) {
        addLog({ file: "", status: "error", message: `Không tìm thấy thư mục nguồn: ${SRC_DIR}` });
        setFinished(true);
        setRunning(false);
        return;
      }

      const entries = await readDir(SRC_DIR);
      const txtFiles = entries.filter(
        (e) => e.name && /^No\d+\.txt$/i.test(e.name)
      );

      setTotal(txtFiles.length);

      for (const entry of txtFiles) {
        const name = entry.name!;
        const src = `${SRC_DIR}\\${name}`;
        const dest = `${DEST_DIR}\\${name}`;
        try {
          await copyFile(src, dest);
          addLog({ file: name, status: "ok" });
        } catch (err) {
          addLog({ file: name, status: "error", message: String(err) });
        }
        setDone((prev) => prev + 1);
      }
    } catch (err) {
      addLog({ file: "", status: "error", message: `Lỗi: ${String(err)}` });
    }

    setFinished(true);
    setRunning(false);
  }, [addLog]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runSync();
  }, [runSync]);

  const successCount = logs.filter((l) => l.status === "ok").length;
  const errorCount = logs.filter((l) => l.status === "error").length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 border border-gray-600 rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-bold text-lg">SYNCDATA</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {SRC_DIR} → {DEST_DIR}
            </p>
          </div>
          {finished && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl px-2"
            >
              ✕
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-5 py-3 border-b border-gray-700 flex items-center gap-4">
          {running && (
            <span className="animate-spin text-blue-400 text-lg">⟳</span>
          )}
          {finished && (
            <span className={errorCount > 0 ? "text-yellow-400" : "text-green-400"}>
              {errorCount > 0 ? "⚠" : "✓"}
            </span>
          )}
          <div className="flex-1">
            <div className="text-sm text-gray-300">
              {finished
                ? `Xong: ${successCount} thành công, ${errorCount} lỗi`
                : total > 0
                ? `Đang copy ${done}/${total} file...`
                : "Đang đọc thư mục..."}
            </div>
            {total > 0 && (
              <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((done / total) * 100)}%` }}
                />
              </div>
            )}
          </div>
          <span className="text-gray-500 text-xs">
            {total > 0 ? `${done}/${total}` : ""}
          </span>
        </div>

        {/* Log */}
        <div className="flex-1 overflow-y-auto px-5 py-3 font-mono text-xs space-y-0.5">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${
                log.status === "ok" ? "text-green-400" : "text-red-400"
              }`}
            >
              <span className="shrink-0">{log.status === "ok" ? "✓" : "✗"}</span>
              <span>
                {log.file || ""}
                {log.message ? ` — ${log.message}` : ""}
              </span>
            </div>
          ))}
          {running && logs.length === 0 && (
            <div className="text-gray-500">Đang khởi động...</div>
          )}
        </div>

        {/* Footer */}
        {finished && (
          <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
