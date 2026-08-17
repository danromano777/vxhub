import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { extFilter, IMAGE_ONLY_EXTS } from '../lib/uploadFilter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.join(__dirname, '..', '..', 'uploads', 'site');
fs.mkdirSync(siteDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: siteDir,
    filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: extFilter(IMAGE_ONLY_EXTS),
});

const router = Router();
router.use(requireAuth);

const CAN_WRITE = requireRole('admin', 'editor');

const FIELDS = ['title', 'subtitle', 'description', 'logo_url'];

router.get('/', async (req, res) => {
  const [[content]] = [(await pool.query('SELECT title,subtitle,description,logo_url FROM site_content WHERE id=1'))[0]];
  res.json(content || {});
});

router.put('/', CAN_WRITE, async (req, res) => {
  const values = FIELDS.map((f) => req.body[f] ?? '');
  await pool.query(`UPDATE site_content SET ${FIELDS.map((f) => `${f}=?`).join(',')} WHERE id=1`, values);
  res.json({ ok: true });
});

router.post('/upload', CAN_WRITE, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const logoUrl = `/uploads/site/${req.file.filename}`;
  await pool.query('UPDATE site_content SET logo_url = ? WHERE id=1', [logoUrl]);
  res.json({ logo_url: logoUrl });
});

export default router;
