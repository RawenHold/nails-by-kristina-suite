import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/nativeAuth";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import logo from "@/assets/logo-wide.svg";

type Step = "credentials" | "otp";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
        toast.success("Код отправлен на почту");
        setStep("otp");
        setOtp("");
      }
    } catch (err: any) {
      const msg = err.message || "Что-то пошло не так";
      // Если email не подтверждён — переключаемся на ввод кода
      if (isLogin && /confirm|verif/i.test(msg)) {
        const { error } = await supabase.auth.resend({ type: "signup", email });
        if (!error) {
          toast.info("Введите код из письма для подтверждения почты");
          setStep("otp");
          setOtp("");
        } else {
          toast.error(msg);
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
      if (error) throw error;
      // Если сессии после verify нет (например, вход после подтверждения) — выполним signIn
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) await signIn(email, password);
      toast.success("Добро пожаловать! 💅");
    } catch (err: any) {
      toast.error(err.message || "Неверный код");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("Новый код отправлен");
    } catch (err: any) {
      toast.error(err.message || "Не удалось отправить");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="text-center mb-10">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
            className="w-full max-w-[260px] h-20 flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="K Nails Finance" className="w-full h-full object-contain drop-shadow-lg" />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1.5">Ваша премиум бьюти-система</p>
        </div>

        {step === "credentials" ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Электронная почта</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
                  placeholder="you@example.com" required autoComplete="email" />
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

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">или</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={async () => {
                const result = await signInWithGoogle();
                if (result.error) toast.error("Не удалось войти через Google");
              }}
              className="w-full h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm flex items-center justify-center gap-2.5 active:opacity-80"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Войти через Google
            </motion.button>

            <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-sm text-muted-foreground mt-5 py-2 active:opacity-70">
              {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <span className="text-primary font-semibold">{isLogin ? "Регистрация" : "Войти"}</span>
            </button>
          </>
        ) : (
          <div className="space-y-5">
            <button
              onClick={() => { setStep("credentials"); setOtp(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground active:opacity-70"
            >
              <ArrowLeft className="w-4 h-4" /> Назад
            </button>

            <div className="text-center">
              <h2 className="text-lg font-display font-semibold text-foreground">Подтверждение почты</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Мы отправили 6-значный код на<br />
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  if (v.length === 6) handleVerifyOtp(v);
                }}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {loading && (
              <div className="flex justify-center">
                <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full text-center text-sm text-primary font-semibold py-2 active:opacity-70 disabled:opacity-50"
            >
              {resending ? "Отправка..." : "Отправить код повторно"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
