import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'logos');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${req.params.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Arquivo deve ser uma imagem'));
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

const CAN_WRITE = requireRole('admin', 'editor');

const BRAND_FIELDS = [
  'slug', 'name', 'display_html', 'brand_group', 'filter_key', 'description',
  'grad_a', 'grad_b', 'grad_c', 'grad_d', 'grad_base', 'grad_glow', 'grad_pale', 'logo_url',
  'drive_logos_url', 'drive_fonts_url', 'drive_colors_url', 'brandguide_url', 'sort_order',
];

function brandValues(body) {
  return BRAND_FIELDS.map((f) => {
    if (f === 'grad_pale') return !!body[f];
    if (f === 'sort_order') return body[f] || 0;
    return body[f] ?? '';
  });
}

router.get('/', async (req, res) => {
  const [brands] = await pool.query('SELECT * FROM brands ORDER BY sort_order, id');
  res.json(brands);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [[brand]] = [(await pool.query('SELECT * FROM brands WHERE id = ?', [id]))[0]];
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' });
  const [logos] = await pool.query('SELECT * FROM brand_logos WHERE brand_id = ? ORDER BY sort_order, id', [id]);
  const [fonts] = await pool.query('SELECT * FROM brand_fonts WHERE brand_id = ? ORDER BY sort_order, id', [id]);
  const [colors] = await pool.query('SELECT * FROM brand_colors WHERE brand_id = ? ORDER BY sort_order, id', [id]);
  res.json({ ...brand, logos, fonts, colors });
});

router.post('/', CAN_WRITE, async (req, res) => {
  const [result] = await pool.query(
    `INSERT INTO brands (${BRAND_FIELDS.join(',')}) VALUES (${BRAND_FIELDS.map(() => '?').join(',')})`,
    brandValues(req.body)
  );
  res.status(201).json({ id: result.insertId });
});

router.put('/:id', CAN_WRITE, async (req, res) => {
  await pool.query(
    `UPDATE brands SET ${BRAND_FIELDS.map((f) => `${f}=?`).join(',')} WHERE id=?`,
    [...brandValues(req.body), req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', CAN_WRITE, async (req, res) => {
  await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

router.post('/:id/logo', CAN_WRITE, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  await pool.query('UPDATE brands SET logo_url = ? WHERE id = ?', [logoUrl, req.params.id]);
  res.json({ logo_url: logoUrl });
});

function subResource(table, fields) {
  const r = Router({ mergeParams: true });

  r.post('/', CAN_WRITE, async (req, res) => {
    const values = fields.map((f) => req.body[f] ?? (f === 'sort_order' ? 0 : ''));
    const [result] = await pool.query(
      `INSERT INTO ${table} (brand_id,${fields.join(',')}) VALUES (?,${fields.map(() => '?').join(',')})`,
      [req.params.id, ...values]
    );
    res.status(201).json({ id: result.insertId });
  });

  r.put('/:itemId', CAN_WRITE, async (req, res) => {
    const values = fields.map((f) => req.body[f] ?? (f === 'sort_order' ? 0 : ''));
    await pool.query(
      `UPDATE ${table} SET ${fields.map((f) => `${f}=?`).join(',')} WHERE id=? AND brand_id=?`,
      [...values, req.params.itemId, req.params.id]
    );
    res.json({ ok: true });
  });

  r.delete('/:itemId', CAN_WRITE, async (req, res) => {
    await pool.query(`DELETE FROM ${table} WHERE id=? AND brand_id=?`, [req.params.itemId, req.params.id]);
    res.status(204).end();
  });

  return r;
}

router.use('/:id/logos', subResource('brand_logos', ['name', 'hex', 'image_url', 'sort_order']));
router.use('/:id/fonts', subResource('brand_fonts', ['name', 'sort_order']));
router.use('/:id/colors', subResource('brand_colors', ['hex', 'rgb', 'cmyk', 'pantone', 'sort_order']));

export default router;
