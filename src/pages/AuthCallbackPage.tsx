import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink } from "lucide-react";
import logo from "@/assets/logo.png";
import { APP_URL_SCHEME, consumeAuthCallbackUrl } from "@/lib/deepLinkAuth";

type CallbackState = "finishing" | "recovery_ready" | "success" | "error";

/**
 * Builds a deep-link into the native app, preserving query/hash so the app
 * can finish the auth exchange itself.
 */
function buildNativeDeepLink(currentUrl: string, path = "/auth/callback") {
  const url = new URL(currentUrl);
  const params = new URLSearchParams(url.search);
  params.delete("native");
  const search = params.toString();
  return `${APP_URL_SCHEME}:/${path}${search ? `?${search}` : ""}${url.hash}`;
}

export default function AuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("finishing");

  const flow = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = hash.get("type") || search.get("type");
    const isRecovery = type === "recovery";
    const isNative = search.get("native") === "1";
    return { isRecovery, isNative };
  }, [location.search]);

  // Deep-link target for "Open app" button. For recovery we point straight at
  // /reset-password so the app can pick up the tokens and show the form.
  const nativeOpenUrl = useMemo(
    () => buildNativeDeepLink(window.location.href, flow.isRecovery ? "/reset-password" : "/auth/callback"),
    [flow.isRecovery],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Recovery: don't consume the token on the web bridge — let the app do it
      // (otherwise the one-shot link is burned and the app sees "expired").
      // Just show a friendly success screen and offer to open the app.
      if (flow.isRecovery) {
        if (!cancelled) setState("recovery_ready");
        // On native we can also auto-open immediately
        if (flow.isNative) window.location.replace(nativeOpenUrl);
        return;
      }

      // Native non-recovery: bounce straight into the app
      if (flow.isNative) {
        window.location.replace(buildNativeDeepLink(window.location.href));
        return;
      }

      // Web: finish the session here and route into the app
      const success = await consumeAuthCallbackUrl(window.location.href);
      if (cancelled) return;
      if (!success) { setState("error"); return; }
      navigate("/", { replace: true });
    })();

    return () => { cancelled = true; };
  }, [flow.isRecovery, flow.isNative, nativeOpenUrl, navigate]);

  if (state === "recovery_ready") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-lg"
        >
          <img src={logo} alt="K Nails Finance" className="mx-auto mb-5 h-16 w-16 drop-shadow-lg" />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Ссылка подтверждена</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Откройте приложение, чтобы задать новый пароль.
          </p>

          <a
            href={nativeOpenUrl}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть приложение
          </a>

          <button
            onClick={() => {
              // Web fallback: consume token here and go to /reset-password
              consumeAuthCallbackUrl(window.location.href).then((ok) => {
                navigate(ok ? "/reset-password" : "/", { replace: true });
              });
            }}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-secondary text-sm font-medium text-foreground"
          >
            Продолжить в браузере
          </button>
        </motion.div>
      </div>
    );
  }

  const title = state === "error" ? "Не удалось подтвердить email" : "Подтверждаем вход";
  const description =
    state === "error"
      ? "Ссылка устарела или недействительна. Попробуйте отправить письмо ещё раз."
      : "Завершаем авторизацию…";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-lg"
      >
        <img src={logo} alt="K Nails Finance" className="mx-auto mb-5 h-16 w-16 drop-shadow-lg" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {state !== "error" && (
          <div className="mx-auto mt-6 h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        )}
      </motion.div>
    </div>
  );
}
