import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-wide.svg";

export default function ResetPasswordPage() {
  const { updatePassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Без действующей сессии (recovery-token) сюда попадать нельзя
    if (!authLoading && !user) {
      toast.error("Ссылка устарела. Запросите новое письмо.");
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Пароль минимум 6 символов"); return; }
    if (password !== confirm) { toast.error("Пароли не совпадают"); return; }
    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Пароль обновлён ✨");
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось обновить пароль";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-full max-w-[260px] h-20 flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="K Nails Finance" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">Придумайте новый пароль</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Новый пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Повторите пароль</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Обновить пароль"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
