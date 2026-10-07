/* eslint-disable @typescript-eslint/no-explicit-any */
export const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".bmp",
  ".gif",
  ".tiff",
  ".tif",
  ".svg",
  ".heic",
  ".heif",
];

export const isImageFile = (file: File): boolean => {
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  const name = file.name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
};

// ---------------------------------------------------------------------------
// Content check: a file only counts as an image if its first bytes match a real
// image format. This catches text, PDF or Word files that were renamed to ".png".
// The backend runs the same check again (routers/detection.py).
// ---------------------------------------------------------------------------

export const SUPPORTED_FORMATS = ["PNG", "JPG", "JPEG", "WEBP", "BMP", "GIF", "TIFF", "SVG", "HEIC", "HEIF"];

// HEIC / HEIF files start with an "ftyp" box that names one of these brands.
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);

const matches = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.slice(start, end));

/** The real format of the file, read from its first bytes, or null if it is not a supported image. */
export const detectImageFormat = (bytes: Uint8Array): string | null => {
  if (matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "PNG";
  if (matches(bytes, [0xff, 0xd8, 0xff])) return "JPEG";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "GIF";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "WEBP";
  if (ascii(bytes, 0, 2) === "BM") return "BMP";
  if (matches(bytes, [0x49, 0x49, 0x2a, 0x00]) || matches(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return "TIFF";
  if (ascii(bytes, 4, 8) === "ftyp" && HEIF_BRANDS.has(ascii(bytes, 8, 12))) return "HEIC";
  // SVG is text: it must start like XML / SVG and contain an <svg> tag
  const head = new TextDecoder().decode(bytes).trimStart().toLowerCase();
  if (/^(<\?xml|<svg|<!--|<!doctype svg)/.test(head) && head.includes("<svg")) return "SVG";
  return null;
};

/** Why a file was refused. "server" = refused by the backend check. */
export type RejectionCode = "not-image" | "fake-image" | "empty" | "unreadable" | "server";

export interface RejectedFile {
  name: string;
  code: RejectionCode;
  reason: string;
}

type Rejection = Pick<RejectedFile, "code" | "reason">;

/** Why a file cannot be used, or null when it is a real, supported image. */
export const checkImageFile = async (file: File): Promise<Rejection | null> => {
  if (!isImageFile(file)) return { code: "not-image", reason: "This file type is not an image." };
  if (file.size === 0) return { code: "empty", reason: "The file is empty." };
  try {
    const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    if (!detectImageFormat(bytes)) {
      return { code: "fake-image", reason: "The name ends like an image, but the content is not a real image." };
    }
  } catch {
    return { code: "unreadable", reason: "The file could not be read." };
  }
  return null;
};

/** Split files into real images and rejected files (with the reason for each). */
export const splitValidImages = async (
  files: File[],
): Promise<{ valid: File[]; rejected: RejectedFile[] }> => {
  const results = await Promise.all(files.map(checkImageFile));
  const valid: File[] = [];
  const rejected: RejectedFile[] = [];
  files.forEach((file, i) => {
    const problem = results[i];
    if (problem) rejected.push({ name: file.name, ...problem });
    else valid.push(file);
  });
  return { valid, rejected };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Recursively traverses directory entries dropped by user and extracts all image files.
 */
export const traverseDirectoryEntry = async (entry: any): Promise<File[]> => {
  const files: File[] = [];

  const readEntry = async (item: any): Promise<void> => {
    if (item.isFile) {
      await new Promise<void>((resolve) => {
        item.file(
          (file: File) => {
            if (isImageFile(file)) {
              files.push(file);
            }
            resolve();
          },
          () => resolve()
        );
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const allEntries: any[] = [];
        const readBatch = async (): Promise<void> => {
          const batch: any[] = await new Promise((resolve) => {
            dirReader.readEntries(
              (results: any[]) => resolve(results || []),
              () => resolve([])
            );
          });
          if (batch.length > 0) {
            allEntries.push(...batch);
            await readBatch();
          }
        };
        await readBatch();
        return allEntries;
      };

      const childEntries = await readAllEntries();
      for (const child of childEntries) {
        await readEntry(child);
      }
    }
  };

  await readEntry(entry);
  return files;
};
