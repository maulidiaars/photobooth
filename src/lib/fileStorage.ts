import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface SaveResult {
  publicPath: string;
}

/**
 * Decodes a `data:image/...;base64,...` string and writes it under
 * `public/<subDir>`, returning the public URL path to reference it.
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

  const dir = path.join(process.cwd(), "public", subDir);
  await fs.mkdir(dir, { recursive: true });

  const fileName = `${fileNamePrefix}-${uuidv4()}.${ext}`;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);

  return { publicPath: `/${subDir}/${fileName}` };
}

export async function deletePublicFile(publicPath: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
    await fs.unlink(filePath);
  } catch {
    // File may already be gone — safe to ignore.
  }
}
