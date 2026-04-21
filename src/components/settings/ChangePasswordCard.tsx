import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordCard() {
  const { updatePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Пароль минимум 6 символов"); return; }
    if (password !== confirm) { toast.error("Пароли не совпадают"); return; }
    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Пароль обновлён ✨");
      setPassword("");
      setConfirm("");
      setOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось обновить пароль";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-primary" /> Смена пароля
        </p>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="text-[11px] font-semibold text-primary px-3 h-7 rounded-full bg-primary/10 active:scale-95 transition"
          >
            Изменить
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 pr-11 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Новый пароль"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Повторите пароль"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setPassword(""); setConfirm(""); }}
              className="flex-1 h-11 rounded-2xl bg-secondary text-foreground text-sm font-semibold active:scale-[0.98]"
            >
              Отмена
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </motion.button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Старый пароль не нужен — вы уже вошли в аккаунт.
          </p>
        </form>
      )}
    </GlassCard>
  );
}
