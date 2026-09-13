import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "./firebase";

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Compresses and converts an image File to an optimized Base64 Data URL (WebP/JPEG).
 * Scales down large camera/mobile photos so they fit cleanly in Firestore documents (< 200KB).
 */
export async function fileToOptimizedDataUrl(
  file: File | Blob,
  maxDimension = 1000,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's SVG or GIF, keep it as-is to preserve vector or animation
    if ("type" in file && (file.type === "image/svg+xml" || file.type === "image/gif")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data URL if image tag fails to load
        resolve(reader.result as string);
      };
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first for ultra-lightweight size, fallback to JPEG
          let dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          resolve(dataUrl);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Bulletproof image upload:
 * Attempts Firebase Storage first. If Firebase Storage fails (CORS, missing rules,
 * unauthorized, or network timeout), it automatically falls back to an optimized
 * Base64 Data URL so the upload NEVER fails for the user!
 */
export async function uploadFileToStorage(
  path: string,
  file: File | Blob,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  // Check if we can attempt Firebase Storage
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const storagePromise = new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (onProgress && snapshot.totalBytes > 0) {
            const percent = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            );
            onProgress(percent);
          }
        },
        (error) => {
          console.warn("Storage upload error, using optimized fallback:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        },
      );
    });

    // 8-second timeout for slow or blocked Firebase Storage connections
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Storage timeout")), 8000),
    );

    return await Promise.race([storagePromise, timeoutPromise]);
  } catch (err) {
    console.warn("Firebase Storage failed or timed out. Falling back to optimized inline data URL:", err);
    if (onProgress) onProgress(100);
    return await fileToOptimizedDataUrl(file);
  }
}

/**
 * Deletes a file from Firebase Storage given its path or full URL
 */
export async function deleteFileFromStorage(pathOrUrl: string): Promise<void> {
  try {
    if (!pathOrUrl || pathOrUrl.startsWith("data:")) return;
    const fileRef = ref(storage, pathOrUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn("Failed to delete storage file:", err);
  }
}
