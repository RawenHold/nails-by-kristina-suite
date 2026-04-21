import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-wide.svg";

type Stage = "verifying" | "ready" | "expired";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Самостоятельно обрабатываем токен из ссылки сброса пароля
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const search = url.searchParams;

        // 1) Hash-формат: #access_token=...&refresh_token=...
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!cancelled) setStage(error ? "expired" : "ready");
          return;
        }
        if (hash.get("error")) {
          if (!cancelled) setStage("expired");
          return;
        }

        // 2) Новый формат: ?token_hash=...&type=recovery
        const token_hash = search.get("token_hash");
        const type = search.get("type");
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "recovery" | "signup" | "magiclink" | "email",
          });
          if (!cancelled) setStage(error ? "expired" : "ready");
          return;
        }

        // 3) PKCE: ?code=...
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!cancelled) setStage(error ? "expired" : "ready");
          return;
        }

        // 4) Уже есть активная сессия (например, открыли из ссылки в приложении)
        const { data: { session } } = await supabase.auth.getSession();
        if (!cancelled) setStage(session ? "ready" : "expired");
      } catch {
        if (!cancelled) setStage("expired");
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-full max-w-[260px] h-20 flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="K Nails Finance" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            {stage === "ready" ? "Придумайте новый пароль" : stage === "expired" ? "Ссылка устарела" : "Проверяем ссылку…"}
          </p>
        </div>

        {stage === "verifying" && (
          <div className="flex justify-center py-10">
            <div className="w-9 h-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        )}

        {stage === "expired" && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Ссылка для сброса пароля устарела или уже была использована. Запросите новое письмо.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/", { replace: true })}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20"
            >
              Вернуться к входу
            </motion.button>
          </div>
        )}

        {stage === "ready" && (
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
        )}
      </motion.div>
    </div>
  );
}
