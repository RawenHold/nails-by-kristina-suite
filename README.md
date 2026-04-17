# Nails by Kristina

Premium nail master business OS — built with React + Vite + TypeScript, backed by Lovable Cloud (Supabase).

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Build output goes to `dist/` (used by Capacitor as `webDir`).

## Android (Capacitor APK)

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

After any web code change re-run:
```bash
npm run build && npx cap sync android
```
