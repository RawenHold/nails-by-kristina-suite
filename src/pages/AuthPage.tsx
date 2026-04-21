import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-wide.svg";

type Mode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Введите электронную почту"); return; }
    if (mode !== "forgot") {
      if (!password.trim()) { toast.error("Введите пароль"); return; }
      if (password.length < 6) { toast.error("Пароль минимум 6 символов"); return; }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("С возвращением! 💅");
      } else if (mode === "signup") {
        await signUp(email, password);
        toast.success("Аккаунт создан! 💅");
      } else {
        await sendPasswordReset(email);
        toast.success("Письмо для сброса пароля отправлено 💌");
        setMode("login");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Что-то пошло не так";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: "Войти",
    signup: "Создать аккаунт",
    forgot: "Сбросить пароль",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="w-full max-w-[260px] h-20 flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="K Nails Finance" className="w-full h-full object-contain drop-shadow-lg" />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1.5">
            {mode === "forgot" ? "Введите email — пришлём ссылку для сброса" : "Ваша премиум бьюти-система"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Электронная почта</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <AnimatePresence initial={false}>
            {mode !== "forgot" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="mt-2 text-[12px] text-primary font-semibold active:opacity-70"
                  >
                    Забыли пароль?
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Подождите...
              </span>
            ) : titles[mode]}
          </motion.button>
        </form>

        {mode === "forgot" ? (
          <button onClick={() => setMode("login")} className="w-full text-center text-sm text-muted-foreground mt-5 py-2 active:opacity-70 inline-flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Вернуться к входу
          </button>
        ) : (
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-center text-sm text-muted-foreground mt-5 py-2 active:opacity-70">
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <span className="text-primary font-semibold">{mode === "login" ? "Регистрация" : "Войти"}</span>
          </button>
        )}
      </motion.div>
    </div>
  );
}
