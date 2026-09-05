import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi';
import compressImage from '../../utils/compressImage';

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ChatComposer = ({ onSend, sending, uploadProgress, initialText = '', placeholder = 'Type a message...' }) => {
  const [text, setText] = useState(initialText);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  const handleFiles = async (fileList) => {
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images per message`);
      return;
    }
    const files = Array.from(fileList).slice(0, room);
    const accepted = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, and WEBP images are allowed`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: file is too large (max 5MB)`);
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const compressed = await compressImage(file);
      accepted.push({ file: compressed, previewUrl: URL.createObjectURL(compressed) });
    }

    setImages((prev) => [...prev, ...accepted].slice(0, MAX_IMAGES));
  };

  const removeImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSend = () => {
    if (sending || (!text.trim() && images.length === 0)) return;
    onSend({ text: text.trim(), images: images.map((i) => i.file) });
    setText('');
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 shrink-0">
      {images.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="relative shrink-0">
              <img src={img.previewUrl} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-ink text-white rounded-full p-0.5"
                aria-label="Remove image"
              >
                <FiX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {sending && uploadProgress != null && (
        <div className="mb-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brandPrimary transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= MAX_IMAGES || sending}
          className="shrink-0 p-2.5 rounded-xl text-brandPrimary hover:bg-primary-50 disabled:opacity-40 transition-colors"
          aria-label="Attach image"
        >
          <FiPaperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={sending}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-brandPrimary focus:ring-4 focus:ring-brandPrimary/10"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!text.trim() && images.length === 0)}
          className="shrink-0 p-2.5 rounded-xl bg-brandPrimary hover:bg-brandPrimaryHover text-white disabled:opacity-40 transition-colors"
          aria-label="Send message"
        >
          <FiSend size={18} />
        </button>
      </div>
      <p className="text-[10px] text-ink-faint mt-1.5 px-1">
        Tip: a clear photo of the medicine name, packaging, or label helps the pharmacy identify it quickly.
      </p>
    </div>
  );
};

export default ChatComposer;
