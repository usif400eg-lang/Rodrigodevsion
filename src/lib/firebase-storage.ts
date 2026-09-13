export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Compresses and converts an image File to an optimized Base64 Data URL (WebP/JPEG).
 * Scales down large camera/mobile photos so they fit cleanly in Firestore documents (< 100KB).
 * Requires ZERO Firebase Storage Blaze plan and works 100% offline and online!
 */
export async function fileToOptimizedDataUrl(
  file: File | Blob,
  maxDimension = 800,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's SVG, preserve vector markup directly
    if ("type" in file && file.type === "image/svg+xml") {
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
          if (!dataUrl || !dataUrl.startsWith("data:image/webp")) {
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
 * Resilient image upload:
 * Converts and compresses the image locally in milliseconds.
 * Stores directly inside Firestore without needing Firebase Storage (Blaze) plan!
 */
export async function uploadFileToStorage(
  _path: string,
  file: File | Blob,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  if (onProgress) onProgress(30);

  try {
    const result = await fileToOptimizedDataUrl(file, 800, 0.82);
    if (onProgress) onProgress(100);
    return result;
  } catch (err) {
    console.warn("Optimization failed, falling back to raw Data URL:", err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve(reader.result as string);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Deletes a file from storage if needed (no-op for inline/external URLs)
 */
export async function deleteFileFromStorage(_pathOrUrl: string): Promise<void> {
  // Data URLs and external URLs don't need cloud deletion
  return Promise.resolve();
}
