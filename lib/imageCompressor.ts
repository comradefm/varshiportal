"use client";

/**
 * Compresses an image Data URL using HTML5 Canvas.
 * Reduces 5MB+ photos down to ~300KB while preserving high visual quality.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If not an image data URL, return as is
    if (!dataUrl.startsWith("data:image/")) {
      return resolve(dataUrl);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if larger than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);

      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG / WEBP
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      console.log(
        `[ImageCompressor] Original size: ${Math.round(dataUrl.length / 1024)} KB -> Compressed: ${Math.round(compressedDataUrl.length / 1024)} KB`
      );
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };
  });
}
