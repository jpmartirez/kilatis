import exifr from "exifr";

export interface ForensicMetadata {
  sha256: string;
  fileSize: string;
  rawSizeBytes: number;
  fileType: string;
  dimensions: string;
  cameraMake: string;
  cameraModel: string;
  lensModel: string;
  software: string;
  dateOriginal: string;
  iso: string;
  exposureTime: string;
  fNumber: string;
  focalLength: string;
  gpsCoordinates: string;
  colorSpace: string;
  compression: string;
}

export async function computeFileSha256(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "N/A";
  }
}

export async function getImageDimensions(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const dims = `${img.naturalWidth} X ${img.naturalHeight}`;
        URL.revokeObjectURL(url);
        resolve(dims);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("N/A");
      };
      img.src = url;
    } catch {
      resolve("N/A");
    }
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function extractForensicMetadata(file: File): Promise<ForensicMetadata> {
  const [sha256, dimensions] = await Promise.all([
    computeFileSha256(file),
    getImageDimensions(file),
  ]);

  let exifData: Record<string, unknown> | null = null;
  try {
    exifData = (await exifr.parse(file, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      gps: true,
      translateValues: true,
    })) as Record<string, unknown> | null;
  } catch {
    exifData = null;
  }

  const formatGps = (data: Record<string, unknown> | null): string => {
    if (!data) return "N/A";
    const lat = data.latitude as number | undefined;
    const lon = data.longitude as number | undefined;
    if (typeof lat === "number" && typeof lon === "number") {
      const latDir = lat >= 0 ? "N" : "S";
      const lonDir = lon >= 0 ? "E" : "W";
      return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
    }
    return "N/A";
  };

  const formatDate = (val: unknown): string => {
    if (!val) return "N/A";
    if (val instanceof Date) {
      return val.toISOString().replace("T", " ").substring(0, 19);
    }
    return String(val);
  };

  const formatShutter = (val: unknown): string => {
    if (typeof val === "number") {
      if (val < 1 && val > 0) {
        return `1/${Math.round(1 / val)}s`;
      }
      return `${val}s`;
    }
    return val ? String(val) : "N/A";
  };

  const formatAperture = (val: unknown): string => {
    if (typeof val === "number") return `f/${val.toFixed(1)}`;
    return val ? String(val) : "N/A";
  };

  const formatFocal = (val: unknown): string => {
    if (typeof val === "number") return `${Math.round(val)}mm`;
    return val ? String(val) : "N/A";
  };

  const formatColorSpace = (val: unknown): string => {
    if (!val) return "sRGB";
    if (val === 1 || String(val).toLowerCase().includes("srgb")) return "sRGB";
    if (val === 2 || String(val).toLowerCase().includes("adobe")) return "Adobe RGB";
    if (val === 65535) return "Uncalibrated";
    return String(val);
  };

  const extension = file.name.split(".").pop()?.toUpperCase() || "IMAGE";

  return {
    sha256,
    fileSize: formatBytes(file.size),
    rawSizeBytes: file.size,
    fileType: file.type ? file.type.toUpperCase().split("/")[1] || extension : extension,
    dimensions,
    cameraMake: exifData?.Make ? String(exifData.Make).trim() : "N/A",
    cameraModel: exifData?.Model ? String(exifData.Model).trim() : "N/A",
    lensModel: (exifData?.LensModel || exifData?.LensInfo || exifData?.Lens)
      ? String(exifData.LensModel || exifData.LensInfo || exifData.Lens).trim()
      : "N/A",
    software: exifData?.Software
      ? String(exifData.Software).trim()
      : exifData?.ProcessingSoftware
      ? String(exifData.ProcessingSoftware).trim()
      : "N/A",
    dateOriginal: formatDate(
      exifData?.DateTimeOriginal || exifData?.CreateDate || exifData?.ModifyDate
    ),
    iso: exifData?.ISO ? `ISO ${exifData.ISO}` : "N/A",
    exposureTime: formatShutter(exifData?.ExposureTime || exifData?.ShutterSpeedValue),
    fNumber: formatAperture(exifData?.FNumber || exifData?.ApertureValue),
    focalLength: formatFocal(exifData?.FocalLength),
    gpsCoordinates: formatGps(exifData),
    colorSpace: formatColorSpace(exifData?.ColorSpace || exifData?.ProfileDescription),
    compression: exifData?.Compression ? String(exifData.Compression) : "Standard DCT",
  };
}
