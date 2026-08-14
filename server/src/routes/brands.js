import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logosDir = path.join(__dirname, '..', '..', 'uploads', 'logos');
const blocksDir = path.join(__dirname, '..', '..', 'uploads', 'blocks');
fs.mkdirSync(logosDir, { recursive: true });
fs.mkdirSync(blocksDir, { recursive: true });

function makeUploader(dir, prefix) {
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${prefix}-${req.params.id}-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}

const uploadLogo = makeUploader(logosDir, 'logo');
const uploadBlock = makeUploader(blocksDir, 'block');

const router = Router();
router.use(requireAuth);

const CAN_WRITE = requireRole('admin', 'editor');

const BRAND_FIELDS = [
  'slug', 'name', 'display_html', 'brand_group', 'filter_key', 'description',
  'grad_a', 'grad_b', 'grad_c', 'grad_d', 'grad_base', 'grad_glow', 'grad_pale', 'logo_url',
  'sort_order',
];

function brandValues(body) {
  return BRAND_FIELDS.map((f) => {
    if (f === 'grad_pale') return !!body[f];
    if (f === 'sort_order') return body[f] || 0;
    return body[f] ?? '';
  });
}

router.get('/', async (req, res) => {
  const [brands] = await pool.query(`
    SELECT b.*,
      (SELECT COUNT(*) FROM sections s WHERE s.brand_id = b.id) AS sections_count,
      (SELECT COUNT(*) FROM blocks bl JOIN sections s2 ON bl.section_id = s2.id WHERE s2.brand_id = b.id) AS blocks_count
    FROM brands b ORDER BY b.sort_order, b.id
  `);
  res.json(brands);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [[brand]] = [(await pool.query('SELECT * FROM brands WHERE id = ?', [id]))[0]];
  if (!brand) return res.status(404).json({ error: 'Marca não encontrada' });
  const [sections] = await pool.query('SELECT * FROM sections WHERE brand_id = ? ORDER BY sort_order, id', [id]);
  const sectionIds = sections.map((s) => s.id);
  let blocks = [];
  if (sectionIds.length) {
    [blocks] = await pool.query(
      `SELECT * FROM blocks WHERE section_id IN (${sectionIds.map(() => '?').join(',')}) ORDER BY sort_order, id`,
      sectionIds
    );
  }
  const sections_full = sections.map((s) => ({ ...s, blocks: blocks.filter((b) => b.section_id === s.id) }));
  res.json({ ...brand, sections: sections_full });
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

router.post('/:id/logo', CAN_WRITE, uploadLogo.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  await pool.query('UPDATE brands SET logo_url = ? WHERE id = ?', [logoUrl, req.params.id]);
  res.json({ logo_url: logoUrl });
});

router.post('/:id/upload', CAN_WRITE, uploadBlock.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({ url: `/uploads/blocks/${req.file.filename}` });
});

const SECTION_FIELDS = ['title', 'type', 'description', 'sort_order'];

function sectionValues(body) {
  return SECTION_FIELDS.map((f) => (f === 'sort_order' ? body[f] || 0 : body[f] ?? ''));
}

router.post('/:id/sections', CAN_WRITE, async (req, res) => {
  const [result] = await pool.query(
    `INSERT INTO sections (brand_id,${SECTION_FIELDS.join(',')}) VALUES (?,${SECTION_FIELDS.map(() => '?').join(',')})`,
    [req.params.id, ...sectionValues(req.body)]
  );
  res.status(201).json({ id: result.insertId });
});

router.put('/:id/sections/:sectionId', CAN_WRITE, async (req, res) => {
  await pool.query(
    `UPDATE sections SET ${SECTION_FIELDS.map((f) => `${f}=?`).join(',')} WHERE id=? AND brand_id=?`,
    [...sectionValues(req.body), req.params.sectionId, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id/sections/:sectionId', CAN_WRITE, async (req, res) => {
  await pool.query('DELETE FROM sections WHERE id=? AND brand_id=?', [req.params.sectionId, req.params.id]);
  res.status(204).end();
});

const BLOCK_FIELDS = [
  'block_type', 'title', 'description', 'file_url', 'thumbnail_url', 'external_url',
  'font_name', 'font_file_url', 'color_hex', 'color_rgb', 'color_cmyk', 'color_pantone',
  'code_content', 'code_language', 'sort_order',
];

function blockValues(body) {
  return BLOCK_FIELDS.map((f) => (f === 'sort_order' ? body[f] || 0 : body[f] ?? ''));
}

router.post('/:id/sections/:sectionId/blocks', CAN_WRITE, async (req, res) => {
  const [result] = await pool.query(
    `INSERT INTO blocks (section_id,${BLOCK_FIELDS.join(',')}) VALUES (?,${BLOCK_FIELDS.map(() => '?').join(',')})`,
    [req.params.sectionId, ...blockValues(req.body)]
  );
  res.status(201).json({ id: result.insertId });
});

router.put('/:id/sections/:sectionId/blocks/:blockId', CAN_WRITE, async (req, res) => {
  await pool.query(
    `UPDATE blocks SET ${BLOCK_FIELDS.map((f) => `${f}=?`).join(',')} WHERE id=? AND section_id=?`,
    [...blockValues(req.body), req.params.blockId, req.params.sectionId]
  );
  res.json({ ok: true });
});

router.delete('/:id/sections/:sectionId/blocks/:blockId', CAN_WRITE, async (req, res) => {
  await pool.query('DELETE FROM blocks WHERE id=? AND section_id=?', [req.params.blockId, req.params.sectionId]);
  res.status(204).end();
});

export default router;
