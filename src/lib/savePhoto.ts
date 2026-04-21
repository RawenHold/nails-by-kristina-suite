import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

/**
 * Saves a remote photo to the device.
 *
 * Native (iOS/Android): writes a JPEG into the app's Documents directory using
 * Capacitor Filesystem. On Android the file lands in the app's external
 * documents folder which is visible in the system Files app. On iOS it appears
 * under "On My iPhone → K Nails Finance" in the Files app.
 *
 * Web: triggers a regular browser download via an <a download> link.
 */
export async function savePhotoToDevice(url: string, filename: string): Promise<"native" | "web"> {
  const res = await fetch(url);
  const blob = await res.blob();

  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob);
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
    return "native";
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
  return "web";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip "data:<mime>;base64,"
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
