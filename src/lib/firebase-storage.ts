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
 * Uploads a file to Firebase Storage under a specified path
 * Returns the public download URL
 */
export async function uploadFileToStorage(
  path: string,
  file: File | Blob,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
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
        console.error("Storage upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

/**
 * Deletes a file from Firebase Storage given its path or full URL
 */
export async function deleteFileFromStorage(pathOrUrl: string): Promise<void> {
  try {
    let fileRef;
    if (pathOrUrl.startsWith("http")) {
      fileRef = ref(storage, pathOrUrl);
    } else {
      fileRef = ref(storage, pathOrUrl);
    }
    await deleteObject(fileRef);
  } catch (err) {
    console.warn("Failed to delete storage file:", err);
  }
}
