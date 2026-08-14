import { put, del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

interface SaveResult {
  publicPath: string;
}

/**
 * Saves a base64 image to Vercel Blob.
 *
 * In local development, this also requires BLOB_READ_WRITE_TOKEN
 * if Vercel Blob is being used.
 */
export async function saveBase64Image(
  base64: string,
  subDir: "frames" | "uploads",
  fileNamePrefix = "img"
): Promise<SaveResult> {
  const match = base64.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);

  if (!match || !match[1] || !match[2]) {
    throw new Error("Format gambar base64 tidak valid");
  }

  const ext = match[1] === "jpeg" ? "jpg" : match[1];

  const buffer = Buffer.from(match[2], "base64");

  const fileName = `${subDir}/${fileNamePrefix}-${uuidv4()}.${ext}`;

  const blob = await put(fileName, buffer, {
    access: "public",
    contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    addRandomSuffix: false,
  });

  return {
    publicPath: blob.url,
  };
}

/**
 * Deletes an image from Vercel Blob.
 *
 * publicPath should contain the full Blob URL saved in the database.
 */
export async function deletePublicFile(
  publicPath: string
): Promise<void> {
  try {
    if (!publicPath) return;

    // Only delete Vercel Blob URLs.
    if (
      publicPath.startsWith("https://") ||
      publicPath.startsWith("http://")
    ) {
      await del(publicPath);
    }
  } catch (error) {
    console.error("Gagal menghapus file dari Vercel Blob:", error);
  }
}