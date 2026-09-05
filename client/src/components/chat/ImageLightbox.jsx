import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

/** Click-to-zoom overlay for a chat image - plain CSS/JS, no new dependency. */
const ImageLightbox = ({ src, onClose }) => {
  useEffect(() => {
    if (!src) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
        aria-label="Close image"
      >
        <FiX size={24} />
      </button>
      <img
        src={src}
        alt="Attachment preview"
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImageLightbox;
