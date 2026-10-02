/**
 * Image compression utility to prevent localStorage quota exhaustion.
 * Resizes uploaded photos to reasonable web dimensions and converts to JPEG with quality compression.
 */
export async function compressImageDataUrl(
  dataUrlOrFile: string | File,
  maxWidth = 720,
  maxHeight = 720,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    // If it's a URL that's not base64 (e.g. Unsplash preset), return as-is
    if (typeof dataUrlOrFile === 'string' && !dataUrlOrFile.startsWith('data:image')) {
      resolve(dataUrlOrFile);
      return;
    }

    const img = new Image();

    const processImage = () => {
      let width = img.width;
      let height = img.height;

      // Calculate constrained dimensions keeping aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback if canvas context fails
        resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
        return;
      }

      // Draw and compress to JPEG
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch {
        resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
      }
    };

    img.onload = processImage;
    img.onerror = () => {
      resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
    };

    if (typeof dataUrlOrFile === 'string') {
      img.src = dataUrlOrFile;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(dataUrlOrFile);
    }
  });
}
