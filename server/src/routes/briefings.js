import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CAN_WRITE = requireRole('admin', 'editor');

const STATUSES = ['rascunho', 'enviado', 'em_revisao', 'aprovado', 'reprovado'];

const BRIEFING_FIELDS = [
  'brand_id', 'title', 'campaign_name', 'job_type', 'job_size', 'requester_name',
  'context', 'objective', 'target_audience', 'product_service', 'key_message', 'concept',
  'scope', 'channels', 'kpis', 'start_date', 'deadline', 'budget', 'dos_donts',
  'references_text', 'history_notes', 'notes', 'open_points',
  'piece_format', 'piece_count', 'video_channel',
];

const DATE_FIELDS = ['start_date', 'deadline'];
const NULLABLE_FIELDS = ['brand_id', 'job_size', 'video_channel', ...DATE_FIELDS];

function briefingValues(body) {
  return BRIEFING_FIELDS.map((f) => {
    if (NULLABLE_FIELDS.includes(f)) return body[f] || null;
    if (f === 'piece_count') return Number(body[f]) || 1;
    if (f === 'piece_format') return body[f] === 'VID' ? 'VID' : 'EST';
    return body[f] ?? '';
  });
}

router.get('/', async (req, res) => {
  const { status, brand_id } = req.query;
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push('br.status = ?');
    params.push(status);
  }
  if (brand_id) {
    clauses.push('br.brand_id = ?');
    params.push(brand_id);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [briefings] = await pool.query(
    `SELECT br.*, b.name AS brand_name, b.code AS brand_code, u.name AS created_by_name
     FROM briefings br
     LEFT JOIN brands b ON b.id = br.brand_id
     LEFT JOIN users u ON u.id = br.created_by
     ${where}
     ORDER BY br.updated_at DESC, br.id DESC`,
    params
  );
  res.json(briefings);
});

router.get('/:id', async (req, res) => {
  const [[briefing]] = [
    (
      await pool.query(
        `SELECT br.*, b.name AS brand_name, b.code AS brand_code, u.name AS created_by_name
         FROM briefings br
         LEFT JOIN brands b ON b.id = br.brand_id
         LEFT JOIN users u ON u.id = br.created_by
         WHERE br.id = ?`,
        [req.params.id]
      )
    )[0],
  ];
  if (!briefing) return res.status(404).json({ error: 'Briefing não encontrado' });
  const [history] = await pool.query(
    `SELECT h.*, u.name AS changed_by_name
     FROM briefing_status_history h
     LEFT JOIN users u ON u.id = h.changed_by
     WHERE h.briefing_id = ?
     ORDER BY h.created_at ASC, h.id ASC`,
    [req.params.id]
  );
  res.json({ ...briefing, history });
});

router.post('/', CAN_WRITE, async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'Informe o título do briefing' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO briefings (${BRIEFING_FIELDS.join(',')},status,created_by) VALUES (${BRIEFING_FIELDS.map(() => '?').join(',')},?,?)`,
      [...briefingValues(req.body), 'rascunho', req.user.id]
    );
    await conn.query(
      'INSERT INTO briefing_status_history (briefing_id,from_status,to_status,changed_by) VALUES (?,?,?,?)',
      [result.insertId, null, 'rascunho', req.user.id]
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.put('/:id', CAN_WRITE, async (req, res) => {
  if (!req.body.title) return res.status(400).json({ error: 'Informe o título do briefing' });
  await pool.query(
    `UPDATE briefings SET ${BRIEFING_FIELDS.map((f) => `${f}=?`).join(',')} WHERE id=?`,
    [...briefingValues(req.body), req.params.id]
  );
  res.json({ ok: true });
});

router.post('/:id/status', CAN_WRITE, async (req, res) => {
  const { status, note } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[briefing]] = await conn.query('SELECT status FROM briefings WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!briefing) {
      await conn.rollback();
      return res.status(404).json({ error: 'Briefing não encontrado' });
    }
    await conn.query('UPDATE briefings SET status = ? WHERE id = ?', [status, req.params.id]);
    await conn.query(
      'INSERT INTO briefing_status_history (briefing_id,from_status,to_status,note,changed_by) VALUES (?,?,?,?,?)',
      [req.params.id, briefing.status, status, note || null, req.user.id]
    );
    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

router.delete('/:id', CAN_WRITE, async (req, res) => {
  await pool.query('DELETE FROM briefings WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

export default router;
