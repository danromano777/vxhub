import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

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

export default router;
