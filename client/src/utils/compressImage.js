// Downscales large images client-side before upload (canvas-based, no new
// dependency) - keeps uploads fast and comfortably under the server's 5MB/file
// limit without asking the user to resize anything themselves.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 800 * 1024; // already small enough, don't bother

export default function compressImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/webp' || file.size < SKIP_BELOW_BYTES) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      if (scale === 1) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // Re-encoding always produces a JPEG - the filename must match, or
          // the server's (extension, mimetype) whitelist check rejects it.
          const newName = `${file.name.replace(/\.[^./\\]+$/, '')}.jpg`;
          resolve(new File([blob], newName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
