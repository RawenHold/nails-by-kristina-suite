# Android: 120 Hz и оптимизации производительности

После того как ты выполнишь:
```
npx cap add android
npx cap sync
```
открой файл `android/app/src/main/java/com/knails/finance/MainActivity.java`
и приведи его к такому виду — это включит **высокую частоту обновления (120 Гц)** и аппаратное ускорение для WebView:

```java
package com.knails.finance;

import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    Window window = getWindow();

    // Запрашиваем максимальную частоту обновления, которую поддерживает дисплей
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      try {
        Window.OnFrameMetricsAvailableListener noop = (w, metrics, dropped) -> {};
        window.getAttributes().preferredDisplayModeId = getHighestRefreshRateModeId();
      } catch (Exception ignored) {}
    }

    // Аппаратное ускорение WebView
    window.setFlags(
      WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
      WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
    );
  }

  private int getHighestRefreshRateModeId() {
    android.view.Display display = getWindowManager().getDefaultDisplay();
    android.view.Display.Mode[] modes = display.getSupportedModes();
    android.view.Display.Mode best = modes[0];
    for (android.view.Display.Mode m : modes) {
      if (m.getRefreshRate() > best.getRefreshRate()
          && m.getPhysicalWidth() == best.getPhysicalWidth()
          && m.getPhysicalHeight() == best.getPhysicalHeight()) {
        best = m;
      }
    }
    return best.getModeId();
  }
}
```

В `android/app/src/main/AndroidManifest.xml` убедись, что в `<application ...>` стоит:
```xml
android:hardwareAccelerated="true"
```
и в `<activity ...>` (для MainActivity):
```xml
android:hardwareAccelerated="true"
```

После правок:
```
npx cap sync android
npx cap run android
```

## iOS (если будешь собирать)
В `ios/App/App/Info.plist` добавь, чтобы iPhone с ProMotion (120 Гц) использовал максимальную частоту:
```xml
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```
