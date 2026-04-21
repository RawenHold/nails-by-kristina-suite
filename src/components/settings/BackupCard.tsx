import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Database } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "@/components/ui/GlassCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";
import { createBackup, restoreBackup, downloadBlob } from "@/lib/backup";
import { format } from "date-fns";

export default function BackupCard() {
  const [working, setWorking] = useState<"export" | "import" | null>(null);
  const [progress, setProgress] = useState({ msg: "", pct: 0 });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleExport = async () => {
    try {
      setWorking("export");
      setProgress({ msg: "Подготовка…", pct: 0 });
      const blob = await createBackup((msg, pct) => setProgress({ msg, pct: pct ?? 0 }));
      const fname = `knails-backup-${format(new Date(), "yyyy-MM-dd_HH-mm")}.zip`;
      downloadBlob(blob, fname);
      toast.success("Бэкап создан и скачан");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось создать бэкап");
    } finally {
      setWorking(null);
      setProgress({ msg: "", pct: 0 });
    }
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting same file later
    if (!f) return;
    setPendingFile(f);
  };

  const handleConfirmRestore = async () => {
    if (!pendingFile) return;
    const file = pendingFile;
    setPendingFile(null);
    try {
      setWorking("import");
      setProgress({ msg: "Чтение…", pct: 0 });
      const m = await restoreBackup(file, (msg, pct) => setProgress({ msg, pct: pct ?? 0 }));
      await queryClient.invalidateQueries();
      toast.success(`Восстановлено: ${Object.values(m.table_counts).reduce((a, b) => a + b, 0)} записей, ${m.photo_count} фото`);
    } catch (e: any) {
      toast.error(e?.message || "Не удалось восстановить");
    } finally {
      setWorking(null);
      setProgress({ msg: "", pct: 0 });
    }
  };

  return (
    <>
      <GlassCard>
        <div className="flex items-center gap-1.5 mb-3">
          <Database className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-semibold text-foreground">Резервное копирование</p>
        </div>

        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
          Сохраните полный архив всех данных (клиенты, записи, оплаты, расходы, фото)
          одним файлом. Архив можно восстановить на этом или другом устройстве.
        </p>

        {working && (
          <div className="mb-3">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${progress.pct}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">{progress.msg}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleExport}
            disabled={!!working}
            className="h-11 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {working === "export" ? "Экспорт…" : "Экспорт"}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => inputRef.current?.click()}
            disabled={!!working}
            className="h-11 rounded-2xl bg-secondary/80 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {working === "import" ? "Импорт…" : "Восстановить"}
          </motion.button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={handlePickFile}
          className="hidden"
        />
      </GlassCard>

      <ConfirmDialog
        open={!!pendingFile}
        onOpenChange={(v) => { if (!v) setPendingFile(null); }}
        onConfirm={handleConfirmRestore}
        title="Восстановить из бэкапа?"
        description={
          `Данные из архива «${pendingFile?.name ?? ""}» будут добавлены к текущим. ` +
          `Существующие записи с такими же ID будут перезаписаны. Удалённые с момента создания бэкапа записи не пострадают.`
        }
        confirmLabel="Восстановить"
        destructive={false}
      />
    </>
  );
}
