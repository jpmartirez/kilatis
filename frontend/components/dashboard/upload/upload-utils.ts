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
