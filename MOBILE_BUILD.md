# 📱 Сборка мобильного приложения (Android & iOS)

Приложение «Nails by Kristina» уже готово к сборке через **Capacitor**.
Capacitor оборачивает веб-приложение в нативный контейнер — все функции
(офлайн-режим, бэкап, фото, авторизация, OAuth, синхронизация) работают
точно так же, как в веб-версии.

---

## 0. Что уже готово в проекте

✅ `capacitor.config.json` — настроен (`com.knails.finance`, `K Nails Finance`)
✅ Иконка приложения — `resources/app-icon-source.png` (без фона, 1024×1024)
✅ Deep-link для OAuth — `knailsfinance://auth/callback`
✅ Auth-bridge — `https://k-nails-finance.lovable.app/auth/callback`
✅ Офлайн-очередь — IndexedDB + автосинхронизация
✅ Кэш React Query в `localStorage` (7 дней)
✅ Native-friendly UI: отключён blur на мобильных, поддержка 120 Гц
✅ Capacitor плагины: `@capacitor/core`, `@capacitor/app`, `@capacitor/browser`

---

## 1. Первичная подготовка (один раз)

### Требования
- **Node.js** ≥ 20
- **Для Android**: Android Studio (последняя версия) + JDK 17
- **Для iOS**: macOS + Xcode 15+ + CocoaPods (`sudo gem install cocoapods`)

### Шаги
```bash
# 1. Скачайте проект из GitHub (кнопка "Export to Github" в Lovable)
git clone <your-repo-url>
cd <project>

# 2. Установите зависимости
npm install

# 3. Соберите веб-версию
npm run build

# 4. Добавьте нативные платформы
npx cap add android
npx cap add ios          # только на macOS

# 5. Сгенерируйте иконки и splash-screen из resources/app-icon-source.png
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#FAF7F2' --iconBackgroundColorDark '#1a1410' --splashBackgroundColor '#FAF7F2' --splashBackgroundColorDark '#1a1410'

# 6. Синхронизация web → native
npx cap sync
```

> **Важно про иконку:** файл `resources/app-icon-source.png` — это исходник
> с прозрачным фоном. `@capacitor/assets` сам:
> - вставит её на Android adaptive icon (фон `#FAF7F2` светлый / `#1a1410` тёмный),
> - на iOS наложит на цветной квадрат (iOS не поддерживает прозрачность иконок).

---

## 2. Сборка Android APK через Android Studio

```bash
npm run build && npx cap sync android
npx cap open android
```

В Android Studio:
1. Дождитесь окончания **Gradle Sync** (внизу справа).
2. Меню: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Когда сборка закончится, появится уведомление **"locate"** —
   жмите его, откроется папка `android/app/build/outputs/apk/debug/`
   с готовым `app-debug.apk`.
4. Скопируйте APK на телефон, разрешите установку из неизвестных источников
   и установите.

### Подписанный release-APK (для Google Play)
1. **Build → Generate Signed Bundle / APK → APK**.
2. Создайте новый keystore (сохраните файл и пароли — без них обновлять
   приложение в Play Store нельзя).
3. Выберите вариант **release** → **V1 + V2 signature**.
4. Готовый APK будет в `android/app/release/`.

### 120 Гц на Android (по желанию)
См. файл `ANDROID_120HZ.md` — небольшая правка `MainActivity.java`.

---

## 3. Сборка iOS IPA через Xcode

```bash
npm run build && npx cap sync ios
npx cap open ios
```

В Xcode:
1. Выберите свою команду разработчика: **Signing & Capabilities → Team**.
2. Замените **Bundle Identifier** на ваш (например `com.yourname.knails`).
3. Подключите iPhone по кабелю → выберите устройство сверху.
4. Жмите ▶️ — приложение установится на телефон.
5. Для App Store: **Product → Archive** → **Distribute App**.

### Deep-link на iOS (для Google OAuth)
Откройте `ios/App/App/Info.plist` и добавьте:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>knailsfinance</string></array>
  </dict>
</array>
```

### Deep-link на Android
Открыть `android/app/src/main/AndroidManifest.xml`, в `<activity>` MainActivity добавить:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="knailsfinance" />
</intent-filter>
```

---

## 4. После любых правок в коде

```bash
npm run build && npx cap sync
```

Затем в Android Studio / Xcode: **Run** или **Build APK**.

---

## 5. Чек-лист функций (всё должно работать)

| Функция                            | Web | Android | iOS |
|------------------------------------|:---:|:-------:|:---:|
| Авторизация Email/Password         | ✅  | ✅      | ✅  |
| Google OAuth (через bridge)        | ✅  | ✅*     | ✅* |
| Apple OAuth                        | ✅  | —       | ✅* |
| Календарь, добавление прошлых дат  | ✅  | ✅      | ✅  |
| Клиенты, визиты, фото              | ✅  | ✅      | ✅  |
| Финансы, расходы, доходы           | ✅  | ✅      | ✅  |
| Таймер сессий                      | ✅  | ✅      | ✅  |
| Офлайн-добавление + автосинк       | ✅  | ✅      | ✅  |
| Экспорт / импорт бэкапа (.json)    | ✅  | ✅      | ✅  |
| Push-уведомления                   | —   | —       | —   |

\* Требует deep-link настроенный в манифесте/Info.plist (см. п.3).

---

## 6. Частые проблемы

- **«Gradle build failed»** → обновите Android Studio + JDK до 17.
- **«Pod install failed» (iOS)** → `cd ios/App && pod install --repo-update`.
- **OAuth не возвращается в приложение** → проверьте, что в манифесте/Info.plist
  прописан `knailsfinance` scheme и URL bridge добавлен в whitelist Lovable Cloud.
- **Белый экран после splash** → пересоберите: `npm run build && npx cap sync`.
- **Изменения не видны** → удалите старую версию приложения с телефона
  и поставьте заново (кэш WebView).
