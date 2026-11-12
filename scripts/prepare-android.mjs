import { readFileSync, writeFileSync, existsSync } from "node:fs";

const config = JSON.parse(readFileSync("capacitor.config.json", "utf8"));
if (config.server?.url) throw new Error("APK must bundle web assets, not load a remote preview URL");
if (!config.appId || config.webDir !== "dist") throw new Error("Invalid native build configuration");
const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = readFileSync(manifestPath, "utf8");
if (!manifest.includes('android:scheme="knailsfinance"')) {
  if (!manifest.includes("</activity>")) throw new Error("MainActivity was not found");
  manifest = manifest.replace("</activity>", `<intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="knailsfinance" android:host="auth" />
            </intent-filter>
        </activity>`);
  writeFileSync(manifestPath, manifest);
}
if (!existsSync("android/gradlew")) throw new Error("Android Gradle wrapper missing");
console.log("Android bundled-assets and auth deep-link checks passed");