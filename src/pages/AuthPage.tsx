import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Заполните все поля"); return; }
    if (password.length < 6) { toast.error("Пароль минимум 6 символов"); return; }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("С возвращением! 💅");
      } else {
        await signUp(email, password);
        toast.success("Аккаунт создан! Проверьте почту для подтверждения.");
      }
    } catch (err: any) {
      toast.error(err.message || "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">Nails by Kristina</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Ваша премиум бьюти-система</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Электронная почта</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
              placeholder="kristina@example.com" required autoComplete="email" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Пароль</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
                placeholder="••••••••" required minLength={6} autoComplete={isLogin ? "current-password" : "new-password"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Подождите...
              </span>
            ) : isLogin ? "Войти" : "Создать аккаунт"}
          </motion.button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm text-muted-foreground mt-5 py-2 active:opacity-70">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <span className="text-primary font-semibold">{isLogin ? "Регистрация" : "Войти"}</span>
        </button>
      </motion.div>
    </div>
  );
}
