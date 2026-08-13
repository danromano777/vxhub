import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res) => {
  const [users] = await pool.query('SELECT id,name,email,role,created_at FROM users ORDER BY id');
  res.json(users);
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Preencha nome, e-mail, senha e perfil' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
      [name, email, hash, role]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'E-mail já cadastrado' });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const { name, role, password } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET name=?,role=?,password_hash=? WHERE id=?', [name, role, hash, req.params.id]);
  } else {
    await pool.query('UPDATE users SET name=?,role=? WHERE id=?', [name, role, req.params.id]);
  }
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
  }
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

export default router;
