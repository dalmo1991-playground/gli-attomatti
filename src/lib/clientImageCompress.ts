/**
 * Compresses an image in the browser using HTML5 Canvas / createImageBitmap
 * to WebP format (max 1920px width, quality 0.82).
 *
 * This reduces 3MB-10MB camera/phone photos down to ~150KB-250KB before uploading,
 * preventing Vercel's 4.5MB request payload limit (FUNCTION_PAYLOAD_TOO_LARGE)
 * and dramatically speeding up uploads.
 */
export async function compressImageClient(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<File> {
  // If SVG or animated GIF, return unmodified
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  try {
    let bitmap: ImageBitmap | HTMLImageElement;
    let origWidth = 0;
    let origHeight = 0;

    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        origWidth = bitmap.width;
        origHeight = bitmap.height;
      } catch {
        // Fallback to Image element if createImageBitmap fails on some formats
        bitmap = await loadImageElement(file);
        origWidth = bitmap.width;
        origHeight = bitmap.height;
      }
    } else {
      bitmap = await loadImageElement(file);
      origWidth = bitmap.width;
      origHeight = bitmap.height;
    }

    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (targetWidth > maxWidth) {
      targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
      targetWidth = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file; // fallback to original file if canvas not supported
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    if ('close' in bitmap && typeof (bitmap as any).close === 'function') {
      (bitmap as any).close();
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        'image/webp',
        quality
      );
    });

    if (!blob) {
      return file;
    }

    const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
    const cleanName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const newFileName = `${cleanName}.webp`;

    return new File([blob], newFileName, {
      type: 'image/webp',
      lastModified: Date.now()
    });
  } catch (err) {
    console.warn('[Client Compression] Failed, falling back to original file:', err);
    return file;
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image element'));
    };
    img.src = url;
  });
}
