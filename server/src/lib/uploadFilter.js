import path from 'path';

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const FONT_EXTS = ['.woff', '.woff2', '.ttf', '.otf'];
const VIDEO_EXTS = ['.mp4', '.webm', '.mov'];

export const IMAGE_ONLY_EXTS = IMAGE_EXTS;
export const BLOCK_FILE_EXTS = [...IMAGE_EXTS, ...FONT_EXTS, ...VIDEO_EXTS];

export function extFilter(allowedExts) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      const err = new Error(`Tipo de arquivo não permitido (${ext || 'sem extensão'}). Extensões aceitas: ${allowedExts.join(', ')}`);
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  };
}
